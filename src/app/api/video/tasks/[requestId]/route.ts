import { NextResponse } from "next/server";
import { fal } from "@/lib/fal-client";
import { AuthError, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAsset } from "@/lib/assets";
import { recordGeneration } from "@/lib/generation-log";
import { VIDEO_MODEL, getVideoTemplate } from "@/features/video/templates";

type VideoResult = { video?: { url?: string; content_type?: string } };

export async function GET(
  request: Request,
  context: RouteContext<"/api/video/tasks/[requestId]">
) {
  try {
    const user = await requireUser();
    const { requestId } = await context.params;
    const url = new URL(request.url);
    const templateId = url.searchParams.get("templateId") || "";
    const chargeRef = url.searchParams.get("chargeRef") || "";
    const startedAt = Number(url.searchParams.get("startedAt") || Date.now());
    const template = getVideoTemplate(templateId);

    if (!template || !chargeRef) {
      return NextResponse.json({ success: false, error: "任务信息不完整" }, { status: 400 });
    }
    const ledger = await prisma.creditLedger.findFirst({
      where: { userId: user.id, refId: chargeRef, reason: "GENERATION" },
    });
    if (!ledger) {
      return NextResponse.json({ success: false, error: "无权查看此任务" }, { status: 403 });
    }

    const status = await fal.queue.status(VIDEO_MODEL, { requestId, logs: true });
    if (status.status !== "COMPLETED") {
      return NextResponse.json({
        success: true,
        task: {
          status: status.status,
          queuePosition: "queue_position" in status ? status.queue_position : null,
        },
      });
    }

    const result = await fal.queue.result(VIDEO_MODEL, { requestId });
    const video = (result.data as VideoResult).video;
    if (!video?.url) throw new Error("模型未返回视频链接");

    const existing = await prisma.asset.findFirst({
      where: { userId: user.id, sourceUrl: video.url, type: "VIDEO" },
    });
    const generation =
      existing ??
      (await recordGeneration({
        userId: user.id,
        feature: "video",
        template: template.name,
        model: VIDEO_MODEL,
        cost: template.cost,
        status: "SUCCESS",
        durationMs: Math.max(0, Date.now() - startedAt),
      }));
    const asset =
      existing ??
      (await createAsset({
        userId: user.id,
        type: "VIDEO",
        title: template.name,
        sourceUrl: video.url,
        template: template.name,
        model: VIDEO_MODEL,
        provider: "fal",
        mimeType: video.content_type ?? "video/mp4",
        generationLogId: generation?.id ?? null,
      }));

    return NextResponse.json({
      success: true,
      task: { status: "COMPLETED", videoUrl: video.url, assetId: asset?.id ?? null },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "查询任务失败" },
      { status: 500 }
    );
  }
}
