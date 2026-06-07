import "server-only";
import { fal } from "@/lib/fal-client";
import { prisma } from "@/lib/prisma";
import { createAsset } from "@/lib/assets";
import { recordGeneration } from "@/lib/generation-log";
import { VIDEO_MODEL } from "@/features/video/templates";
import type { VideoTaskModel } from "@/generated/prisma/models";

type VideoResult = { video?: { url?: string; content_type?: string } };

export async function syncVideoTask(task: VideoTaskModel) {
  if (task.status === "COMPLETED" || task.status === "FAILED") return task;

  try {
    const status = await fal.queue.status(VIDEO_MODEL, {
      requestId: task.requestId,
      logs: true,
    });
    if (status.status !== "COMPLETED") {
      return prisma.videoTask.update({
        where: { id: task.id },
        data: { status: status.status },
      });
    }

    const result = await fal.queue.result(VIDEO_MODEL, {
      requestId: task.requestId,
    });
    const video = (result.data as VideoResult).video;
    if (!video?.url) throw new Error("模型未返回视频链接");

    const existing = await prisma.asset.findFirst({
      where: { userId: task.userId, sourceUrl: video.url, type: "VIDEO" },
    });
    const generation = existing
      ? null
      : await recordGeneration({
          userId: task.userId,
          feature: "video",
          template: task.template,
          model: task.model,
          cost: task.cost,
          status: "SUCCESS",
          durationMs: Date.now() - task.createdAt.getTime(),
        });
    const asset =
      existing ??
      (await createAsset({
        userId: task.userId,
        type: "VIDEO",
        title: task.template,
        sourceUrl: video.url,
        template: task.template,
        model: task.model,
        provider: "fal",
        mimeType: video.content_type ?? "video/mp4",
        generationLogId: generation?.id ?? null,
      }));

    return prisma.videoTask.update({
      where: { id: task.id },
      data: {
        status: "COMPLETED",
        sourceUrl: video.url,
        assetId: asset?.id ?? null,
        completedAt: new Date(),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "查询视频任务失败";
    if (/failed|error|cancel/i.test(message)) {
      return prisma.videoTask.update({
        where: { id: task.id },
        data: { status: "FAILED", errorMsg: message.slice(0, 500) },
      });
    }
    throw error;
  }
}

export async function syncPendingVideoTasks(userId: string) {
  const tasks = await prisma.videoTask.findMany({
    where: { userId, status: { in: ["IN_QUEUE", "IN_PROGRESS"] } },
    orderBy: { createdAt: "desc" },
    take: 10,
  });
  return Promise.allSettled(tasks.map(syncVideoTask));
}
