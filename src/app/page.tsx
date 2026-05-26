import AppShell from "@/components/app-shell";
import { Badge, Card, LinkButton, PageHeader } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";

const modules = [
  {
    href: "/create/image",
    title: "Image Studio",
    desc: "商品图、海报、白底图和抠图。",
    status: "Live",
    live: true,
  },
  {
    href: "/create/copy",
    title: "Copy Studio",
    desc: "广告标题、卖点、CTA 和视频脚本。",
    status: "Next",
    live: false,
  },
  {
    href: "/create/video",
    title: "Video Studio",
    desc: "从商品图和脚本生成短视频。",
    status: "Planned",
    live: false,
  },
  {
    href: "/assets",
    title: "Assets",
    desc: "管理生成过的图片、文案和视频素材。",
    status: "Planned",
    live: false,
  },
];

export default async function Home() {
  const user = await getCurrentUser();
  const shellUser = user
    ? { username: user.username, role: user.role }
    : null;

  return (
    <AppShell initialUser={shellUser}>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Dashboard"
          title="内容生成工作台"
          description="v2 从统一的商用 App 框架开始。先把图片能力放进稳定工作台，再扩展文案、素材和视频。"
          actions={<LinkButton href="/create/image">New image</LinkButton>}
        />

        <div className="grid gap-4 lg:grid-cols-4">
          <Metric label="当前阶段" value="v2 M0" helper="UI Foundation" />
          <Metric label="可用模块" value="1" helper="Image Studio" />
          <Metric label="下一模块" value="Copy" helper="脚本生成前置" />
          <Metric label="产品形态" value="Studio" helper="商业工作台" />
        </div>

        <section className="grid gap-4 lg:grid-cols-2">
          {modules.map((module) => (
            <Card key={module.href} className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold text-gray-950">
                      {module.title}
                    </h2>
                    <Badge tone={module.live ? "success" : "neutral"}>
                      {module.status}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-gray-600">
                    {module.desc}
                  </p>
                </div>
              </div>
              <div className="mt-5">
                {module.live ? (
                  <LinkButton href={module.href} tone="secondary">
                    Open
                  </LinkButton>
                ) : (
                  <button
                    disabled
                    className="inline-flex h-10 cursor-not-allowed items-center justify-center rounded-lg border border-gray-200 px-4 text-sm font-medium text-gray-400"
                  >
                    Coming soon
                  </button>
                )}
              </div>
            </Card>
          ))}
        </section>
      </div>
    </AppShell>
  );
}

function Metric({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <Card className="p-5">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-gray-950">{value}</div>
      <div className="mt-1 text-xs text-gray-500">{helper}</div>
    </Card>
  );
}
