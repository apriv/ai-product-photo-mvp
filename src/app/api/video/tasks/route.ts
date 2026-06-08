import { NextResponse } from "next/server";
import { AuthError, requireUser } from "@/lib/auth";
import {
  chargeCredits,
  InsufficientCreditsError,
  PlanExpiredError,
} from "@/lib/credits";
import { refundCredits } from "@/lib/refund-credits";
import { createRequestId } from "@/lib/request-meta";
import { prisma } from "@/lib/prisma";
import { VIDEO_COST, VIDEO_MODEL } from "@/features/video/templates";
import { createKieVideoTask, uploadKieFile } from "@/lib/kie-client";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_FILES = 4;

export async function POST(request: Request) {
  let userId = "";
  let cost = 0;
  const chargeRef = createRequestId();

  try {
    const user = await requireUser();
    userId = user.id;
    const formData = await request.formData();
    const images = formData.getAll("images").filter((item): item is File => item instanceof File);
    const prompt = String(formData.get("prompt") || "").trim();
    const aspectRatio = String(formData.get("aspectRatio") || "");
    const resolution = String(formData.get("resolution") || "");

    if (!images.length || images.length > MAX_FILES) {
      return NextResponse.json({ success: false, error: `请上传 1-${MAX_FILES} 张图片` }, { status: 400 });
    }
    if (images.some((image) => !image.type.startsWith("image/") || image.size > MAX_FILE_SIZE)) {
      return NextResponse.json({ success: false, error: "每张图片需小于 10MB" }, { status: 400 });
    }
    if (!prompt || prompt.length > 1200) {
      return NextResponse.json({ success: false, error: "Prompt 不能为空且不能超过 1200 字" }, { status: 400 });
    }
    if (!["9:16", "16:9"].includes(aspectRatio) || !["480p", "720p"].includes(resolution)) {
      return NextResponse.json({ success: false, error: "视频参数无效" }, { status: 400 });
    }

    cost = VIDEO_COST;
    await chargeCredits(userId, cost, { reason: "GENERATION", refId: chargeRef });
    const imageUrls = await Promise.all(images.map(uploadKieFile));
    const requestId = await createKieVideoTask({
      prompt,
      imageUrls,
      aspectRatio: aspectRatio as "9:16" | "16:9",
      resolution: resolution as "480p" | "720p",
    });
    const task = await prisma.videoTask.create({
      data: {
        requestId,
        userId,
        templateId: "prompt",
        template: "Prompt 视频",
        model: VIDEO_MODEL,
        cost,
        chargeRef,
        status: "IN_QUEUE",
      },
    });

    return NextResponse.json({
      success: true,
      task: {
        requestId,
        status: "IN_QUEUE",
        templateId: "prompt",
        templateName: "Prompt 视频",
        cost,
        chargeRef,
        startedAt: task.createdAt.getTime(),
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
