import AppShell from "@/components/app-shell";
import { EmptyState, PageHeader } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";

export default async function VideoPage() {
  const user = await getCurrentUser();
  const shellUser = user
    ? { username: user.username, role: user.role }
    : null;

  return (
    <AppShell initialUser={shellUser}>
      <div className="space-y-6">
        <PageHeader
          eyebrow="创建 / 视频"
          title="视频生成"
          description="商品短视频会在 UI 基座、文案生成和素材库稳定后进入实现。"
        />
        <EmptyState
          title="视频生成尚未开放"
          description="v2 会先完成脚本结构、素材管理和长任务状态设计，再接入视频生成模型。"
        />
      </div>
    </AppShell>
  );
}
