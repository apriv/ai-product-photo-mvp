import AppShell from "@/components/app-shell";
import { EmptyState, PageHeader } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";

export default async function CopyPage() {
  const user = await getCurrentUser();
  const shellUser = user
    ? { username: user.username, role: user.role }
    : null;

  return (
    <AppShell initialUser={shellUser}>
      <div className="space-y-6">
        <PageHeader
          eyebrow="创建 / 文案"
          title="文案生成"
          description="广告标题、卖点、CTA 和视频脚本生成会作为 v2 的下一阶段进入实现。"
        />
        <EmptyState
          title="文案生成待实现"
          description="当前先保留路由和导航位置，等 UI Foundation 稳定后再接入生成逻辑。"
        />
      </div>
    </AppShell>
  );
}
