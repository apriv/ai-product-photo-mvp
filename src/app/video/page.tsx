import Link from "next/link";

export default function VideoPage() {
  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-3xl rounded-2xl bg-white p-8 shadow">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">AI 商品视频生成器</h1>
          <Link href="/" className="text-sm text-gray-500 hover:text-black">
            ← 返回首页
          </Link>
        </div>
        <p className="mt-6 text-gray-600">视频生成功能即将上线，敬请期待。</p>
      </div>
    </main>
  );
}
