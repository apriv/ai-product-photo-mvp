import AppShell from "@/components/app-shell";
import { EmptyState, PageHeader } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";

export default async function AssetsPage() {
  const user = await getCurrentUser();
  const shellUser = user
    ? { username: user.username, role: user.role }
    : null;

  return (
    <AppShell initialUser={shellUser}>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Assets"
          title="素材库"
          description="后续会用于管理生成过的图片、海报、文案和视频素材。"
        />
        <EmptyState
          title="Assets 待实现"
          description="v2 会在 Image Studio Refresh 后补上历史记录、筛选和下载入口。"
        />
      </div>
    </AppShell>
  );
}
