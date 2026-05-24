import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function AdminHome() {
  const [userCount, codeCounts, generationCount] = await Promise.all([
    prisma.user.count(),
    prisma.activationCode.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    prisma.generationLog.count(),
  ]);

  const unused =
    codeCounts.find((c) => c.status === "UNUSED")?._count._all ?? 0;
  const used =
    codeCounts.find((c) => c.status === "USED")?._count._all ?? 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">概览</h1>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card label="用户总数" value={userCount} />
        <Card label="未使用激活码" value={unused} />
        <Card label="已使用激活码" value={used} />
        <Card label="累计生成次数" value={generationCount} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Link
          href="/admin/users"
          className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:border-black"
        >
          <div className="text-lg font-medium text-gray-900">用户管理</div>
          <div className="mt-2 text-sm text-gray-600">查看余额、调整额度</div>
        </Link>
        <Link
          href="/admin/codes"
          className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:border-black"
        >
          <div className="text-lg font-medium text-gray-900">激活码管理</div>
          <div className="mt-2 text-sm text-gray-600">
            生成、查看、导出 CSV
          </div>
        </Link>
        <Link
          href="/admin/stats"
          className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:border-black"
        >
          <div className="text-lg font-medium text-gray-900">统计</div>
          <div className="mt-2 text-sm text-gray-600">
            用量、成功率、按模板/用户分布
          </div>
        </Link>
      </div>
    </div>
  );
}

function Card({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="mt-1 text-3xl font-semibold text-gray-900">{value}</div>
    </div>
  );
}
