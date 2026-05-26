import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import AppShell from "@/components/app-shell";
import { Badge, EmptyState, PageHeader } from "@/components/ui";
import { AssetStorage, AssetType } from "@/generated/prisma/enums";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const assetTypeLabel = {
  IMAGE: "图片",
  POSTER: "海报",
  COPY: "文案",
  VIDEO: "视频",
} as const;

const typeFilters = [
  { value: "all", label: "全部类型" },
  { value: "IMAGE", label: "图片" },
  { value: "POSTER", label: "海报" },
  { value: "COPY", label: "文案" },
  { value: "VIDEO", label: "视频" },
] as const;

const timeFilters = [
  { value: "all", label: "全部时间" },
  { value: "7d", label: "近 7 天" },
  { value: "30d", label: "近 30 天" },
  { value: "90d", label: "近 90 天" },
] as const;

const storageFilters = [
  { value: "all", label: "全部状态" },
  { value: "PROVIDER", label: "Provider" },
  { value: "R2", label: "R2" },
] as const;

type AssetsSearchParams = {
  type?: string | string[];
  time?: string | string[];
  storage?: string | string[];
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function buildFilterHref(
  current: { type: string; time: string; storage: string },
  next: Partial<{ type: string; time: string; storage: string }>
) {
  const params = new URLSearchParams();
  const merged = { ...current, ...next };
  if (merged.type !== "all") params.set("type", merged.type);
  if (merged.time !== "all") params.set("time", merged.time);
  if (merged.storage !== "all") params.set("storage", merged.storage);
  const query = params.toString();
  return query ? `/assets?${query}` : "/assets";
}

function getSinceDate(time: string) {
  const now = Date.now();
  if (time === "7d") return new Date(now - 7 * 24 * 60 * 60 * 1000);
  if (time === "30d") return new Date(now - 30 * 24 * 60 * 60 * 1000);
  if (time === "90d") return new Date(now - 90 * 24 * 60 * 60 * 1000);
  return null;
}

export default async function AssetsPage({
  searchParams,
}: {
  searchParams: Promise<AssetsSearchParams>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/assets");

  const query = await searchParams;
  const selectedType = typeFilters.some(
    (item) => item.value === firstParam(query.type)
  )
    ? firstParam(query.type)!
    : "all";
  const selectedTime = timeFilters.some(
    (item) => item.value === firstParam(query.time)
  )
    ? firstParam(query.time)!
    : "all";
  const selectedStorage = storageFilters.some(
    (item) => item.value === firstParam(query.storage)
  )
    ? firstParam(query.storage)!
    : "all";
  const currentFilters = {
    type: selectedType,
    time: selectedTime,
    storage: selectedStorage,
  };
  const sinceDate = getSinceDate(selectedTime);
  const hasFilters =
    selectedType !== "all" ||
    selectedTime !== "all" ||
    selectedStorage !== "all";
  const shellUser = user
    ? { username: user.username, role: user.role }
    : null;
  const assets = await prisma.asset.findMany({
    where: {
      userId: user.id,
      ...(selectedType !== "all" ? { type: selectedType as AssetType } : {}),
      ...(selectedStorage !== "all"
        ? { storage: selectedStorage as AssetStorage }
        : {}),
      ...(sinceDate ? { createdAt: { gte: sinceDate } } : {}),
    },
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

        <section className="space-y-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <FilterRow label="类型">
            {typeFilters.map((item) => (
              <FilterLink
                key={item.value}
                href={buildFilterHref(currentFilters, { type: item.value })}
                active={selectedType === item.value}
              >
                {item.label}
              </FilterLink>
            ))}
          </FilterRow>
          <FilterRow label="时间">
            {timeFilters.map((item) => (
              <FilterLink
                key={item.value}
                href={buildFilterHref(currentFilters, { time: item.value })}
                active={selectedTime === item.value}
              >
                {item.label}
              </FilterLink>
            ))}
          </FilterRow>
          <FilterRow label="状态">
            {storageFilters.map((item) => (
              <FilterLink
                key={item.value}
                href={buildFilterHref(currentFilters, { storage: item.value })}
                active={selectedStorage === item.value}
              >
                {item.label}
              </FilterLink>
            ))}
          </FilterRow>
        </section>

        {assets.length === 0 ? (
          <EmptyState
            title={hasFilters ? "没有匹配素材" : "暂无素材"}
            description={
              hasFilters
                ? "换一个筛选条件，或清空筛选查看全部素材。"
                : "生成图片后，素材会自动出现在这里。"
            }
            action={
              hasFilters ? (
                <Link
                  href="/assets"
                  className="inline-flex h-10 items-center justify-center rounded-lg border border-gray-200 px-4 text-sm font-medium text-gray-800 hover:border-gray-300 hover:bg-gray-50"
                >
                  清空筛选
                </Link>
              ) : (
                <Link
                  href="/create/image"
                  className="inline-flex h-10 items-center justify-center rounded-lg bg-gray-950 px-4 text-sm font-medium text-white hover:bg-gray-800"
                >
                  去生成图片
                </Link>
              )
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

function FilterRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <div className="w-16 shrink-0 text-xs font-medium text-gray-500">
        {label}
      </div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function FilterLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex h-8 items-center rounded-full border px-3 text-xs font-medium transition ${
        active
          ? "border-gray-950 bg-gray-950 text-white"
          : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
      }`}
    >
      {children}
    </Link>
  );
}
