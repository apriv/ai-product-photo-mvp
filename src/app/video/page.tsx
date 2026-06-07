import AppShell from "@/components/app-shell";
import { PageHeader } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import VideoStudio from "./VideoStudio";

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
          description="用商品图和脚本生成可直接用于社媒投放的短视频。"
        />
        <VideoStudio />
      </div>
    </AppShell>
  );
}
