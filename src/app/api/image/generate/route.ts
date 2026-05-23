import { NextResponse } from "next/server";
import sharp from "sharp";
import { fal } from "@/lib/fal-client";
import { AuthError, requireUser } from "@/lib/auth";
import logger from "@/lib/logger";
import { createRequestId, getRequestMeta } from "@/lib/request-meta";
import { getImageTemplate } from "@/features/image/templates";

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

export async function POST(request: Request) {
  const startTime = Date.now();
  const requestId = createRequestId();
  const requestMeta = getRequestMeta(request, requestId);
  let templateName = "";
  let fileSizeMB = "";

  try {
    const user = await requireUser();
    const formData = await request.formData();

    const image = formData.get("image");
    templateName = String(formData.get("template") || "社媒海报");
    const template = getImageTemplate(templateName);

    if (!template) {
      logger.warn("Unknown template", {
        ...requestMeta,
        userId: user.id,
        template: templateName,
      });
      return NextResponse.json(
        { success: false, error: "未知模板" },
        { status: 400 }
      );
    }

    if (template.kind !== "placeholder") {
      if (!image || !(image instanceof File)) {
        logger.warn("No image file received", {
          ...requestMeta,
          template: templateName,
        });
        return NextResponse.json(
          { success: false, error: "没有收到图片文件" },
          { status: 400 }
        );
      }

      fileSizeMB = (image.size / 1024 / 1024).toFixed(2);

      if (image.size > MAX_FILE_SIZE) {
        logger.warn("File size exceeds limit", {
          ...requestMeta,
          template: templateName,
          fileName: image.name,
          fileSize: fileSizeMB,
          maxSize: "10MB",
        });
        return NextResponse.json(
          {
            success: false,
            error: `图片过大（${fileSizeMB}MB），限制 10MB`,
          },
          { status: 400 }
        );
      }

      logger.info("Image processing started", {
        ...requestMeta,
        template: templateName,
        fileName: image.name,
        fileSize: fileSizeMB,
        mimeType: image.type,
      });
    }

    if (template.kind === "placeholder") {
      logger.info("Generating placeholder image", {
        ...requestMeta,
        template: templateName,
      });
      const placeholderUrl = await generatePlaceholder();
      logger.info("Placeholder generated successfully", {
        ...requestMeta,
        template: templateName,
        duration: `${Date.now() - startTime}ms`,
      });
      return NextResponse.json({
        success: true,
        imageUrl: placeholderUrl,
      });
    }

    const imageFile = image as File;

    let uploadUrl: string;
    try {
      const uploadStartTime = Date.now();
      uploadUrl = await fal.storage.upload(imageFile);
      logger.info("Image uploaded to FAL storage", {
        ...requestMeta,
        template: templateName,
        duration: `${Date.now() - uploadStartTime}ms`,
      });
    } catch (uploadError) {
      logger.error("FAL storage upload failed", {
        ...requestMeta,
        template: templateName,
        error:
          uploadError instanceof Error
            ? uploadError.message
            : String(uploadError),
      });
      throw new Error("图片上传失败，请检查网络连接");
    }

    if (template.kind === "fal-birefnet") {
      try {
        const modelStartTime = Date.now();
        logger.info("Starting AI model processing", {
          ...requestMeta,
          template: templateName,
          model: template.model,
        });
        const result = await fal.subscribe(template.model!, {
          input: { image_url: uploadUrl },
        });
        logger.info("AI model completed successfully", {
          ...requestMeta,
          template: templateName,
          model: template.model,
          modelDuration: `${Date.now() - modelStartTime}ms`,
          totalDuration: `${Date.now() - startTime}ms`,
        });
        return NextResponse.json({
          success: true,
          imageUrl: result.data.image.url,
        });
      } catch (modelError) {
        logger.error("Birefnet model failed", {
          ...requestMeta,
          template: templateName,
          model: template.model,
          error:
            modelError instanceof Error ? modelError.message : String(modelError),
          stack: modelError instanceof Error ? modelError.stack : undefined,
        });
        throw new Error("AI 模型处理失败，请重试");
      }
    }

    if (template.kind === "fal-poster") {
      try {
        const modelStartTime = Date.now();
        logger.info("Starting AI model processing", {
          ...requestMeta,
          template: templateName,
          model: template.model,
        });
        const result = await fal.subscribe(template.model!, {
          input: {
            image_urls: [uploadUrl],
            prompt: template.prompt,
          },
        });
        logger.info("AI model completed successfully", {
          ...requestMeta,
          template: templateName,
          model: template.model,
          modelDuration: `${Date.now() - modelStartTime}ms`,
          totalDuration: `${Date.now() - startTime}ms`,
        });
        return NextResponse.json({
          success: true,
          imageUrl: result.data.images[0].url,
        });
      } catch (modelError) {
        logger.error("Poster model failed", {
          ...requestMeta,
          template: templateName,
          model: template.model,
          error:
            modelError instanceof Error ? modelError.message : String(modelError),
          stack: modelError instanceof Error ? modelError.stack : undefined,
        });
        throw new Error("AI 模型处理超时，请重试");
      }
    }

    logger.warn("Unhandled template kind", {
      ...requestMeta,
      template: templateName,
    });
    return NextResponse.json(
      { success: false, error: "未知模板" },
      { status: 400 }
    );
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : "未知错误";
    const errorStack = error instanceof Error ? error.stack : undefined;
    const status = error instanceof AuthError ? error.status : 500;

    logger.error("API error", {
      ...requestMeta,
      template: templateName,
      fileSizeMB,
      duration: `${duration}ms`,
      status,
      error: errorMessage,
      stack: errorStack,
    });

    return NextResponse.json(
      { success: false, error: errorMessage || "生成失败，请重试" },
      { status }
    );
  }
}
