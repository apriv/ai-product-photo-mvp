import { NextResponse } from "next/server";
import { fal } from "@/lib/fal-client";
import { AuthError, requireUser } from "@/lib/auth";
import {
  chargeCredits,
  InsufficientCreditsError,
  PlanExpiredError,
} from "@/lib/credits";
import { refundCredits } from "@/lib/refund-credits";
import { createRequestId } from "@/lib/request-meta";
import {
  getVideoTemplate,
  VIDEO_MODEL,
} from "@/features/video/templates";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function POST(request: Request) {
  let userId = "";
  let cost = 0;
  const chargeRef = createRequestId();

  try {
    const user = await requireUser();
    userId = user.id;
    const formData = await request.formData();
    const image = formData.get("image");
    const templateId = String(formData.get("templateId") || "");
    const script = String(formData.get("script") || "").trim();
    const template = getVideoTemplate(templateId);

    if (!template) {
      return NextResponse.json({ success: false, error: "未知视频模板" }, { status: 400 });
    }
    if (!(image instanceof File)) {
      return NextResponse.json({ success: false, error: "请上传商品图片" }, { status: 400 });
    }
    if (!image.type.startsWith("image/") || image.size > MAX_FILE_SIZE) {
      return NextResponse.json({ success: false, error: "图片需小于 10MB" }, { status: 400 });
    }
    if (script.length > 1200) {
      return NextResponse.json({ success: false, error: "脚本不能超过 1200 字" }, { status: 400 });
    }

    cost = template.cost;
    await chargeCredits(userId, cost, { reason: "GENERATION", refId: chargeRef });
    const imageUrl = await fal.storage.upload(image);
    const prompt = script ? `${template.prompt}\nCreative direction: ${script}` : template.prompt;
    const queued = await fal.queue.submit(VIDEO_MODEL, {
      input: {
        image_url: imageUrl,
        prompt,
        duration: template.duration,
        negative_prompt:
          "blur, distortion, morphing product, duplicated product, text, subtitles, watermark",
      },
    });

    return NextResponse.json({
      success: true,
      task: {
        requestId: queued.request_id,
        status: "IN_QUEUE",
        queuePosition: queued.queue_position,
        templateId: template.id,
        templateName: template.name,
        cost,
        chargeRef,
        startedAt: Date.now(),
      },
    });
  } catch (error) {
    if (userId && cost) await refundCredits(userId, cost, chargeRef);
    if (
      error instanceof InsufficientCreditsError ||
      error instanceof PlanExpiredError ||
      error instanceof AuthError
    ) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status }
      );
    }
    return NextResponse.json(
      { success: false, error: "视频任务提交失败，请稍后重试" },
      { status: 500 }
    );
  }
}
