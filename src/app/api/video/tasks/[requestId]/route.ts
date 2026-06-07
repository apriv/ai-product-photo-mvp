import { NextResponse } from "next/server";
import { AuthError, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { syncVideoTask } from "@/lib/video-tasks";

export async function GET(
  request: Request,
  context: RouteContext<"/api/video/tasks/[requestId]">
) {
  try {
    const user = await requireUser();
    const { requestId } = await context.params;
    const task = await prisma.videoTask.findFirst({
      where: { requestId, userId: user.id },
    });
    if (!task) {
      return NextResponse.json({ success: false, error: "无权查看此任务" }, { status: 403 });
    }
    const synced = await syncVideoTask(task);

    return NextResponse.json({
      success: true,
      task: {
        status: synced.status,
        videoUrl: synced.sourceUrl,
        assetId: synced.assetId,
      },
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
