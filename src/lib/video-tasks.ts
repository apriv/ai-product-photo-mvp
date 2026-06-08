import "server-only";
import { prisma } from "@/lib/prisma";
import { createAsset } from "@/lib/assets";
import { recordGeneration } from "@/lib/generation-log";
import { getKieTask } from "@/lib/kie-client";
import type { VideoTaskModel } from "@/generated/prisma/models";

type VideoResult = { resultUrls?: string[] };

export async function syncVideoTask(task: VideoTaskModel) {
  if (task.status === "COMPLETED" || task.status === "FAILED") return task;

  try {
    const status = await getKieTask(task.requestId);
    if (status.state === "fail") {
      return prisma.videoTask.update({
        where: { id: task.id },
        data: { status: "FAILED", errorMsg: (status.failMsg || "Kie 视频生成失败").slice(0, 500) },
      });
    }
    if (status.state !== "success") {
      return prisma.videoTask.update({
        where: { id: task.id },
        data: { status: status.state === "generating" ? "IN_PROGRESS" : "IN_QUEUE" },
      });
    }

    const result = JSON.parse(status.resultJson || "{}") as VideoResult;
    const videoUrl = result.resultUrls?.[0];
    if (!videoUrl) throw new Error("模型未返回视频链接");

    const existing = await prisma.asset.findFirst({
      where: { userId: task.userId, sourceUrl: videoUrl, type: "VIDEO" },
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
        sourceUrl: videoUrl,
        template: task.template,
        model: task.model,
        provider: "kie",
        mimeType: "video/mp4",
        generationLogId: generation?.id ?? null,
      }));

    return prisma.videoTask.update({
      where: { id: task.id },
      data: {
        status: "COMPLETED",
        sourceUrl: videoUrl,
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
