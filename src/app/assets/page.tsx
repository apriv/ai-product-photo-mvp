import Link from "next/link";
import { redirect } from "next/navigation";
import AppShell from "@/components/app-shell";
import { Badge, EmptyState, PageHeader } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const assetTypeLabel = {
  IMAGE: "图片",
  POSTER: "海报",
  COPY: "文案",
  VIDEO: "视频",
} as const;

export default async function AssetsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/assets");

  const shellUser = user
    ? { username: user.username, role: user.role }
    : null;
  const assets = await prisma.asset.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 60,
  });

  return (
    <AppShell initialUser={shellUser}>
      <div className="space-y-6">
        <PageHeader
          eyebrow="素材库"
          title="素材库"
          description="查看最近生成的图片素材。当前先保存 provider URL，后续收费前接入 R2 转存。"
        />

        {assets.length === 0 ? (
          <EmptyState
            title="暂无素材"
            description="生成图片后，素材会自动出现在这里。"
            action={
              <Link
                href="/create/image"
                className="inline-flex h-10 items-center justify-center rounded-lg bg-gray-950 px-4 text-sm font-medium text-white hover:bg-gray-800"
              >
                去生成图片
              </Link>
            }
          />
        ) : (
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {assets.map((asset) => (
              <article
                key={asset.id}
                className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm"
              >
                <div className="aspect-[4/3] bg-gray-100">
                  {asset.type === "COPY" ? (
                    <div className="flex h-full items-center justify-center px-6 text-center text-sm text-gray-500">
                      文案素材
                    </div>
                  ) : (
                    <img
                      src={asset.sourceUrl}
                      alt={asset.title}
                      className="h-full w-full object-contain"
                    />
                  )}
                </div>
                <div className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="truncate text-sm font-semibold text-gray-950">
                        {asset.title}
                      </h2>
                      <p className="mt-1 text-xs text-gray-500">
                        {new Date(asset.createdAt).toLocaleString("zh-CN")}
                      </p>
                    </div>
                    <Badge tone={asset.storage === "R2" ? "success" : "neutral"}>
                      {asset.storage === "R2" ? "R2" : "Provider"}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                    <span className="rounded-full bg-gray-100 px-2 py-1">
                      {assetTypeLabel[asset.type]}
                    </span>
                    {asset.template && (
                      <span className="rounded-full bg-gray-100 px-2 py-1">
                        {asset.template}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={asset.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-9 flex-1 items-center justify-center rounded-lg bg-gray-950 px-3 text-sm font-medium text-white hover:bg-gray-800"
                    >
                      打开
                    </a>
                    <a
                      href={asset.sourceUrl}
                      download
                      className="inline-flex h-9 flex-1 items-center justify-center rounded-lg border border-gray-200 px-3 text-sm font-medium text-gray-800 hover:border-gray-300 hover:bg-gray-50"
                    >
                      下载
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </AppShell>
  );
}
