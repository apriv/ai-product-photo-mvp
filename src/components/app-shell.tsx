"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { cn, Sheet } from "./ui";

type ShellUser = {
  username: string;
  role: string;
};

type WalletSnapshot = {
  balance: number;
  activePlanId: string | null;
  planExpiresAt: string | null;
};

type NavItem = {
  href: string;
  label: string;
  detail?: string;
  match?: string[];
  disabled?: boolean;
};

const createItems: NavItem[] = [
  {
    href: "/create/image",
    label: "图片生成",
    detail: "商品图 / 海报 / 白底图",
    match: ["/create/image", "/image"],
  },
  {
    href: "/create/copy",
    label: "文案生成",
    detail: "广告文案 / 标题 / CTA",
    match: ["/create/copy"],
  },
  {
    href: "/create/video",
    label: "视频生成",
    detail: "商品短视频",
    match: ["/create/video", "/video"],
  },
];

const primaryItems: NavItem[] = [
  { href: "/", label: "首页", detail: "工作台总览", match: ["/"] },
  ...createItems,
  { href: "/assets", label: "素材库", detail: "素材与历史", disabled: true },
  { href: "/account", label: "账户", detail: "余额与套餐" },
];

const adminItems: NavItem[] = [
  { href: "/admin", label: "管理概览", match: ["/admin"] },
  { href: "/admin/users", label: "用户" },
  { href: "/admin/codes", label: "激活码" },
  { href: "/admin/stats", label: "统计" },
];

function itemIsActive(item: NavItem, pathname: string) {
  const matches = item.match ?? [item.href];
  return matches.some((match) =>
    match === "/" ? pathname === "/" : pathname.startsWith(match)
  );
}

export default function AppShell({
  children,
  initialUser,
}: {
  children: React.ReactNode;
  initialUser?: ShellUser | null;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<ShellUser | null>(initialUser ?? null);
  const [wallet, setWallet] = useState<WalletSnapshot | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadAccount() {
      try {
        const response = await fetch("/api/account/wallet", {
          cache: "no-store",
        });
        if (!response.ok) return;
        const json = await response.json();
        if (!cancelled && json.success) {
          setUser(json.user);
          setWallet(json.wallet);
        }
      } catch {
        // Shell metadata should never block the working page.
      }
    }
    loadAccount();
    return () => {
      cancelled = true;
    };
  }, []);

  const currentLabel = useMemo(() => {
    const allItems = [...primaryItems, ...adminItems];
    return allItems.find((item) => itemIsActive(item, pathname))?.label ?? "工作台";
  }, [pathname]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-gray-100 text-gray-950">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-gray-200 bg-white lg:flex lg:flex-col">
        <div className="flex h-16 items-center border-b border-gray-200 px-5">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-950 text-sm font-semibold text-white">
              AI
            </span>
            <span>
              <span className="block text-sm font-semibold text-gray-950">
                自媒体大王
              </span>
              <span className="block text-xs text-gray-500">
                商品内容生成工作台
              </span>
            </span>
          </Link>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
          <NavSection title="工作区" items={primaryItems} pathname={pathname} />
          {user?.role === "ADMIN" && (
            <NavSection title="管理" items={adminItems} pathname={pathname} />
          )}
        </nav>

        <div className="border-t border-gray-200 p-4">
          <div className="rounded-lg bg-gray-50 p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-gray-950">
                  {user?.username ?? "账户"}
                </div>
                <div className="text-xs text-gray-500">
                  {wallet ? `${wallet.balance} 积分` : "余额加载中"}
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="rounded-md px-2 py-1 text-xs text-gray-500 hover:bg-white hover:text-gray-950"
              >
                退出
              </button>
            </div>
          </div>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/95 backdrop-blur">
          <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-700 lg:hidden"
                aria-label="打开导航"
              >
                <span className="text-lg leading-none">=</span>
              </button>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-gray-950">
                  {currentLabel}
                </div>
                <div className="hidden text-xs text-gray-500 sm:block">
                  商品内容生成工作台
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {wallet && (
                <Link
                  href="/account"
                  className="hidden rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 sm:inline-flex"
                >
                  {wallet.balance} 积分
                </Link>
              )}
            </div>
          </div>
        </header>

        <main className="min-h-[calc(100vh-4rem)] px-4 pb-24 pt-4 sm:px-6 lg:px-8 lg:pb-6">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>

      <MobileBottomNav pathname={pathname} />

      <Sheet
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        title="自媒体大王"
      >
        <nav className="space-y-6 px-3 py-4">
          <NavSection title="工作区" items={primaryItems} pathname={pathname} />
          {user?.role === "ADMIN" && (
            <NavSection title="管理" items={adminItems} pathname={pathname} />
          )}
        </nav>
      </Sheet>
    </div>
  );
}

function NavSection({
  title,
  items,
  pathname,
}: {
  title: string;
  items: NavItem[];
  pathname: string;
}) {
  return (
    <div>
      <div className="px-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
        {title}
      </div>
      <div className="mt-2 space-y-1">
        {items.map((item) => (
          <NavLink key={item.href} item={item} active={itemIsActive(item, pathname)} />
        ))}
      </div>
    </div>
  );
}

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  const className = cn(
    "flex min-h-11 items-center justify-between rounded-lg px-3 py-2 text-sm transition",
    active
      ? "bg-gray-950 text-white"
      : "text-gray-700 hover:bg-gray-100 hover:text-gray-950",
    item.disabled && "cursor-not-allowed opacity-45 hover:bg-transparent"
  );

  const content = (
    <>
      <span className="min-w-0">
        <span className="block truncate font-medium">{item.label}</span>
        {item.detail && (
          <span
            className={cn(
              "block truncate text-xs",
              active ? "text-gray-300" : "text-gray-400"
            )}
          >
            {item.detail}
          </span>
        )}
      </span>
      {item.disabled && <span className="text-xs text-gray-400">待开放</span>}
    </>
  );

  if (item.disabled) {
    return <div className={className}>{content}</div>;
  }

  return (
    <Link href={item.href} className={className}>
      {content}
    </Link>
  );
}

function MobileBottomNav({ pathname }: { pathname: string }) {
  const items: NavItem[] = [
    { href: "/", label: "首页", match: ["/"] },
    { href: "/create/image", label: "创建", match: ["/create", "/image"] },
    { href: "/assets", label: "素材", disabled: true },
    { href: "/account", label: "账户" },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-gray-200 bg-white lg:hidden">
      <div className="grid grid-cols-4">
        {items.map((item) => {
          const active = itemIsActive(item, pathname);
          const className = cn(
            "flex h-16 flex-col items-center justify-center gap-1 text-xs font-medium",
            active ? "text-gray-950" : "text-gray-500",
            item.disabled && "cursor-not-allowed opacity-40"
          );
          if (item.disabled) {
            return (
              <div key={item.href} className={className}>
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                {item.label}
              </div>
            );
          }
          return (
            <Link key={item.href} href={item.href} className={className}>
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
