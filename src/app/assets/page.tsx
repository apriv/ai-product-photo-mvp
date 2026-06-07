import Image from "next/image";
import Link from "next/link";
import AppShell from "@/components/app-shell";
import { Badge, Card, EmptyState, LinkButton, PageHeader } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { syncPendingVideoTasks } from "@/lib/video-tasks";

type AssetsPageProps = {
  searchParams: Promise<{ type?: string }>;
};

const filters = [
  { value: "all", label: "全部" },
  { value: "image", label: "图片" },
  { value: "video", label: "视频" },
];

export default async function AssetsPage({ searchParams }: AssetsPageProps) {
  const user = await getCurrentUser();
  const shellUser = user ? { username: user.username, role: user.role } : null;
  const { type = "all" } = await searchParams;

  if (user) await syncPendingVideoTasks(user.id);

  const assets = user
    ? await prisma.asset.findMany({
        where: {
          userId: user.id,
          ...(type === "video"
            ? { type: "VIDEO" as const }
            : type === "image"
              ? { type: { in: ["IMAGE" as const, "POSTER" as const] } }
              : {}),
        },
        orderBy: { createdAt: "desc" },
      })
    : [];
  const pendingTasks =
    user && type !== "image"
      ? await prisma.videoTask.findMany({
          where: { userId: user.id, status: { in: ["IN_QUEUE", "IN_PROGRESS"] } },
          orderBy: { createdAt: "desc" },
        })
      : [];

  return (
    <AppShell initialUser={shellUser}>
      <div className="space-y-6">
        <PageHeader
          eyebrow="素材 / 历史"
          title="素材库"
          description="查看生成过的图片和视频。这里只保存 API 返回链接，不保存媒体文件到应用服务器。"
          actions={<LinkButton href="/create/image">创建新素材</LinkButton>}
        />

        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => (
            <Link
              key={filter.value}
              href={filter.value === "all" ? "/assets" : `/assets?type=${filter.value}`}
              className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
                type === filter.value || (type === "all" && filter.value === "all")
                  ? "border-gray-950 bg-gray-950 text-white"
                  : "border-gray-200 bg-white text-gray-600 hover:border-gray-400"
              }`}
            >
              {filter.label}
            </Link>
          ))}
        </div>

        {pendingTasks.length > 0 && (
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold">生成中的视频</h2>
              <span className="text-xs text-gray-500">刷新页面可同步最新状态</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {pendingTasks.map((task) => (
                <Card key={task.id} className="p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-medium">{task.template}</div>
                    <Badge tone="warning">
                      {task.status === "IN_QUEUE" ? "排队中" : "生成中"}
                    </Badge>
                  </div>
                  <p className="mt-3 text-xs leading-5 text-gray-500">
                    任务已保留。离开生成页面后，返回素材库即可继续同步结果。
                  </p>
                </Card>
              ))}
            </div>
          </section>
        )}

        {assets.length > 0 ? (
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold">已完成素材</h2>
              <span className="text-xs text-gray-500">{assets.length} 个结果</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {assets.map((asset) => (
                <Card key={asset.id} className="overflow-hidden">
                  <div className="relative aspect-video bg-gray-100">
                    {asset.type === "VIDEO" ? (
                      <video
                        src={asset.sourceUrl}
                        controls
                        preload="metadata"
                        playsInline
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <Image
                        src={asset.sourceUrl}
                        alt={asset.title}
                        fill
                        unoptimized
                        className="object-contain"
                      />
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-medium">{asset.title}</h3>
                        <p className="mt-1 text-xs text-gray-500">
                          {formatDate(asset.createdAt)}
                        </p>
                      </div>
                      <Badge>{asset.type === "VIDEO" ? "视频" : "图片"}</Badge>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <a
                        href={asset.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex h-9 flex-1 items-center justify-center rounded-lg bg-gray-950 px-3 text-sm font-medium text-white"
                      >
                        打开
                      </a>
                      <a
                        href={asset.sourceUrl}
                        download
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex h-9 flex-1 items-center justify-center rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700"
                      >
                        下载
                      </a>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        ) : (
          pendingTasks.length === 0 && (
            <EmptyState
              title="还没有素材"
              description="完成图片或视频生成后，API 返回的素材链接会出现在这里。"
              action={<LinkButton href="/create/image">生成第一张图片</LinkButton>}
            />
          )
        )}
      </div>
    </AppShell>
  );
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
