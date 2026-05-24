import { NextResponse } from "next/server";
import sharp from "sharp";
import { fal } from "@/lib/fal-client";
import { AuthError, requireUser } from "@/lib/auth";
import {
  chargeCredits,
  InsufficientCreditsError,
  PlanExpiredError,
} from "@/lib/credits";
import { prisma } from "@/lib/prisma";
import { recordGeneration } from "@/lib/generation-log";
import logger from "@/lib/logger";
import { createRequestId, getRequestMeta } from "@/lib/request-meta";
import { getImageTemplate, type ImageTemplate } from "@/features/image/templates";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

async function generatePlaceholder(): Promise<string> {
  const svg = `
    <svg width="800" height="800" xmlns="http://www.w3.org/2000/svg">
      <rect width="800" height="800" fill="white"/>
      <rect x="50" y="50" width="700" height="700" fill="none" stroke="#ddd" stroke-width="2" stroke-dasharray="10,5"/>
      <text x="400" y="380" font-family="Arial" font-size="32" fill="#999" text-anchor="middle">
        白底主图 (Placeholder)
      </text>
      <text x="400" y="440" font-family="Arial" font-size="16" fill="#bbb" text-anchor="middle">
        测试用 - 不消耗 Token
      </text>
      <text x="400" y="480" font-family="Arial" font-size="14" fill="#ddd" text-anchor="middle">
        生成时间: ${new Date().toLocaleString("zh-CN")}
      </text>
    </svg>
  `;
  const buffer = await sharp(Buffer.from(svg)).png().toBuffer();
  return `data:image/png;base64,${buffer.toString("base64")}`;
}

// Refund a previously-charged amount (e.g. fal failed after we already
// deducted credits). Best-effort: a refund failure is logged but doesn't
// override the original error the user sees.
async function refund(userId: string, amount: number, refId: string) {
  if (amount <= 0) return;
  try {
    await prisma.$transaction(async (tx) => {
      const wallet = await tx.creditWallet.findUnique({ where: { userId } });
      if (!wallet) return;
      const newBalance = wallet.balance + amount;
      await tx.creditWallet.update({
        where: { userId },
        data: { balance: newBalance },
      });
      await tx.creditLedger.create({
        data: {
          userId,
          delta: amount,
          reason: "REFUND",
          refId,
          balanceAfter: newBalance,
        },
      });
    });
  } catch (e) {
    logger.error("refund failed", {
      userId,
      amount,
      refId,
      error: e instanceof Error ? e.message : String(e),
    });
  }
}

async function runFalModel(template: ImageTemplate, uploadUrl: string) {
  if (template.kind === "fal-birefnet") {
    const result = await fal.subscribe(template.model!, {
      input: { image_url: uploadUrl },
    });
    return result.data.image.url as string;
  }
  // fal-poster
  const result = await fal.subscribe(template.model!, {
    input: {
      image_urls: [uploadUrl],
      prompt: template.prompt,
    },
  });
  return result.data.images[0].url as string;
}

export async function POST(request: Request) {
  const startTime = Date.now();
  const requestId = createRequestId();
  const requestMeta = getRequestMeta(request, requestId);
  let templateName = "";
  let userId = "";
  let fileSizeMB = "";

  try {
    const user = await requireUser();
    userId = user.id;

    const formData = await request.formData();
    const image = formData.get("image");
    templateName = String(formData.get("template") || "社媒海报");
    const template = getImageTemplate(templateName);

    if (!template) {
      logger.warn("Unknown template", {
        ...requestMeta,
        userId,
        template: templateName,
      });
      return NextResponse.json(
        { success: false, error: "未知模板" },
        { status: 400 }
      );
    }

    // Validate input (file required unless placeholder)
    if (template.kind !== "placeholder") {
      if (!image || !(image instanceof File)) {
        return NextResponse.json(
          { success: false, error: "没有收到图片文件" },
          { status: 400 }
        );
      }
      fileSizeMB = (image.size / 1024 / 1024).toFixed(2);
      if (image.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          {
            success: false,
            error: `图片过大（${fileSizeMB}MB），限制 10MB`,
          },
          { status: 400 }
        );
      }
    }

    // ----- Placeholder: no charge, no fal -----
    if (template.kind === "placeholder") {
      const placeholderUrl = await generatePlaceholder();
      const duration = Date.now() - startTime;
      logger.info("Placeholder generated", {
        ...requestMeta,
        userId,
        template: templateName,
        duration: `${duration}ms`,
      });
      await recordGeneration({
        userId,
        feature: "image",
        template: templateName,
        cost: 0,
        status: "SUCCESS",
        durationMs: duration,
      });
      return NextResponse.json({ success: true, imageUrl: placeholderUrl });
    }

    // ----- Real generation: charge first, then call fal -----
    try {
      await chargeCredits(userId, template.cost, {
        reason: "GENERATION",
        refId: requestId,
      });
    } catch (chargeError) {
      if (
        chargeError instanceof InsufficientCreditsError ||
        chargeError instanceof PlanExpiredError
      ) {
        logger.warn("charge rejected", {
          ...requestMeta,
          userId,
          template: templateName,
          reason: chargeError.message,
        });
        return NextResponse.json(
          { success: false, error: chargeError.message },
          { status: 402 }
        );
      }
      throw chargeError;
    }

    const imageFile = image as File;

    let uploadUrl: string;
    try {
      uploadUrl = await fal.storage.upload(imageFile);
    } catch (uploadError) {
      await refund(userId, template.cost, requestId);
      logger.error("FAL storage upload failed", {
        ...requestMeta,
        userId,
        template: templateName,
        error:
          uploadError instanceof Error
            ? uploadError.message
            : String(uploadError),
      });
      await recordGeneration({
        userId,
        feature: "image",
        template: templateName,
        model: template.model,
        cost: 0, // refunded
        status: "FAILED",
        errorMsg: "upload failed",
        durationMs: Date.now() - startTime,
      });
      return NextResponse.json(
        { success: false, error: "图片上传失败，请检查网络连接" },
        { status: 500 }
      );
    }

    try {
      const modelStart = Date.now();
      const imageUrl = await runFalModel(template, uploadUrl);
      const duration = Date.now() - startTime;
      logger.info("AI model completed", {
        ...requestMeta,
        userId,
        template: templateName,
        model: template.model,
        modelDuration: `${Date.now() - modelStart}ms`,
        totalDuration: `${duration}ms`,
        cost: template.cost,
      });
      await recordGeneration({
        userId,
        feature: "image",
        template: templateName,
        model: template.model,
        cost: template.cost,
        status: "SUCCESS",
        durationMs: duration,
      });
      return NextResponse.json({ success: true, imageUrl });
    } catch (modelError) {
      await refund(userId, template.cost, requestId);
      const errMsg =
        modelError instanceof Error ? modelError.message : String(modelError);
      logger.error("AI model failed", {
        ...requestMeta,
        userId,
        template: templateName,
        model: template.model,
        error: errMsg,
        stack: modelError instanceof Error ? modelError.stack : undefined,
      });
      await recordGeneration({
        userId,
        feature: "image",
        template: templateName,
        model: template.model,
        cost: 0, // refunded
        status: "FAILED",
        errorMsg: errMsg.slice(0, 500),
        durationMs: Date.now() - startTime,
      });
      return NextResponse.json(
        { success: false, error: "AI 模型处理失败，请重试" },
        { status: 502 }
      );
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : "未知错误";
    const status = error instanceof AuthError ? error.status : 500;

    logger.error("API error", {
      ...requestMeta,
      userId,
      template: templateName,
      fileSizeMB,
      duration: `${duration}ms`,
      status,
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      { success: false, error: errorMessage || "生成失败，请重试" },
      { status }
    );
  }
}
