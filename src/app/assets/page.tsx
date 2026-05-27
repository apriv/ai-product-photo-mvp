import AppShell from "@/components/app-shell";
import { Badge } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";

export default async function AssetsPage() {
  const user = await getCurrentUser();
  const shellUser = user
    ? { username: user.username, role: user.role }
    : null;

  return (
    <AppShell initialUser={shellUser}>
      <section className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-gray-500 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-base font-semibold text-gray-500">素材库</h1>
            <p className="mt-2 text-sm leading-6">
              素材库暂未开放，后续会统一修复素材保存、检索、打开和下载流程。
            </p>
          </div>
          <Badge tone="neutral">待开放</Badge>
        </div>
      </section>
    </AppShell>
  );
}
