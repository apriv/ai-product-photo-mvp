import AppShell from "@/components/app-shell";
import { Badge, Card, LinkButton, PageHeader } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";

const createModules = [
  {
    href: "/create/image",
    title: "图片生成",
    desc: "上传商品图，生成商品图、海报、白底图或抠图结果。",
    status: "可用",
    live: true,
  },
  {
    href: "/create/copy",
    title: "文案生成",
    desc: "生成广告标题、卖点、CTA 和短视频脚本。",
    status: "可用",
    live: true,
  },
  {
    href: "/create/video",
    title: "视频生成",
    desc: "用商品图和脚本生成商品短视频。",
    status: "待开放",
    live: false,
  },
];

const quickLinks = [
  {
    href: "/account",
    title: "账户与积分",
    desc: "查看余额、套餐状态和最近积分流水。",
    live: true,
  },
  {
    href: "/assets",
    title: "素材库",
    desc: "查看最近生成的图片素材，打开或下载结果。",
    live: true,
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
          eyebrow="首页"
          title="今天要生成什么？"
          description="从商品图开始创建内容。后续文案、素材库和视频功能会沿用同一套工作台。"
          actions={<LinkButton href="/create/image">生成图片</LinkButton>}
        />

        <section className="grid gap-4 lg:grid-cols-3">
          {createModules.map((module) => (
            <Card key={module.href} className="p-5">
              <div className="flex min-h-36 flex-col justify-between gap-5">
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
                <div>
                  {module.live ? (
                    <LinkButton href={module.href} tone="secondary">
                      开始
                    </LinkButton>
                  ) : (
                    <button
                      disabled
                      className="inline-flex h-10 cursor-not-allowed items-center justify-center rounded-lg border border-gray-200 px-4 text-sm font-medium text-gray-400"
                    >
                      待开放
                    </button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          {quickLinks.map((item) => (
            <Card key={item.href} className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-base font-semibold text-gray-950">
                    {item.title}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-gray-600">
                    {item.desc}
                  </p>
                </div>
                <Badge tone={item.live ? "success" : "neutral"}>
                  {item.live ? "可用" : "待开放"}
                </Badge>
              </div>
              <div className="mt-5">
                {item.live ? (
                  <LinkButton href={item.href} tone="ghost">
                    查看
                  </LinkButton>
                ) : (
                  <button
                    disabled
                    className="inline-flex h-10 cursor-not-allowed items-center justify-center rounded-lg px-4 text-sm font-medium text-gray-400"
                  >
                    待开放
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
