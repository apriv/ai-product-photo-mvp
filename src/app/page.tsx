import Link from "next/link";

const features = [
  {
    href: "/image",
    title: "AI 商品图生成",
    desc: "上传商品照片，生成海报/白底图/抠图。",
    enabled: true,
  },
  {
    href: "/video",
    title: "AI 商品视频生成",
    desc: "视频生成功能即将上线。",
    enabled: false,
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold text-gray-900">电商 AI 助手</h1>
        <p className="mt-3 text-gray-600">选择一个功能开始。</p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {features.map((feature) =>
            feature.enabled ? (
              <Link
                key={feature.href}
                href={feature.href}
                className="block rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:border-black"
              >
                <div className="text-lg font-medium text-gray-900">
                  {feature.title}
                </div>
                <div className="mt-2 text-sm text-gray-600">{feature.desc}</div>
              </Link>
            ) : (
              <div
                key={feature.href}
                className="block rounded-2xl border border-gray-200 bg-gray-100 p-6 text-gray-400"
              >
                <div className="text-lg font-medium">{feature.title}</div>
                <div className="mt-2 text-sm">{feature.desc}</div>
              </div>
            )
          )}
        </div>
      </div>
    </main>
  );
}
