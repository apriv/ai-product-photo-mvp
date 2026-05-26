"use client";

import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/ui";

type StatsData = {
  range: string;
  since: string | null;
  overall: {
    total: number;
    success: number;
    failed: number;
    successRate: number | null;
    creditsSpent: number;
  };
  templates: {
    template: string;
    success: number;
    failed: number;
    credits: number;
  }[];
  users: {
    userId: string;
    username: string;
    total: number;
    credits: number;
  }[];
};

const RANGES = [
  { id: "1d", label: "近 24 小时" },
  { id: "7d", label: "近 7 天" },
  { id: "30d", label: "近 30 天" },
  { id: "all", label: "全部" },
] as const;

export default function AdminStatsPage() {
  const [range, setRange] = useState<string>("7d");
  const [data, setData] = useState<StatsData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const r = await fetch(`/api/admin/stats?range=${range}`, {
        cache: "no-store",
      });
      const json = await r.json();
      if (!r.ok || !json.success) {
        throw new Error(json.error || "读取失败");
      }
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "读取失败");
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    const id = window.requestAnimationFrame(() => {
      load();
    });
    return () => window.cancelAnimationFrame(id);
  }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <PageHeader
          eyebrow="管理"
          title="统计"
          description="按时间窗口查看生成成功率、积分消耗、模板和用户分布。"
        />
        <div className="flex gap-2 text-sm">
          {RANGES.map((r) => (
            <button
              key={r.id}
              onClick={() => setRange(r.id)}
              className={`rounded-lg px-3 py-1.5 ${
                range === r.id
                  ? "bg-black text-white"
                  : "border border-gray-200 text-gray-600 hover:border-black"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {!data ? (
        <div className="text-sm text-gray-500">{loading ? "加载中..." : "—"}</div>
      ) : (
        <>
          <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Card label="总生成次数" value={data.overall.total} />
            <Card label="成功" value={data.overall.success} accent="green" />
            <Card label="失败" value={data.overall.failed} accent="red" />
            <Card
              label="成功率"
              value={
                data.overall.successRate === null
                  ? "—"
                  : `${(data.overall.successRate * 100).toFixed(1)}%`
              }
            />
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-5">
            <div className="text-sm text-gray-500">该区间累计积分消费</div>
            <div className="mt-1 text-2xl font-semibold text-gray-900">
              {data.overall.creditsSpent}{" "}
              <span className="text-sm font-normal text-gray-500">积分</span>
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white">
            <div className="border-b border-gray-100 px-5 py-3 text-sm font-medium text-gray-900">
              按模板
            </div>
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="px-5 py-2.5 font-normal">模板</th>
                  <th className="px-5 py-2.5 text-right font-normal">成功</th>
                  <th className="px-5 py-2.5 text-right font-normal">失败</th>
                  <th className="px-5 py-2.5 text-right font-normal">成功率</th>
                  <th className="px-5 py-2.5 text-right font-normal">
                    消费积分
                  </th>
                  <th className="px-5 py-2.5 font-normal">占比</th>
                </tr>
              </thead>
              <tbody>
                {data.templates.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-gray-400">
                      该区间暂无数据
                    </td>
                  </tr>
                ) : (
                  data.templates.map((t) => {
                    const total = t.success + t.failed;
                    const sr = total === 0 ? 0 : t.success / total;
                    const share =
                      data.overall.total === 0
                        ? 0
                        : total / data.overall.total;
                    return (
                      <tr key={t.template} className="border-t border-gray-100">
                        <td className="px-5 py-2.5 text-gray-900">{t.template}</td>
                        <td className="px-5 py-2.5 text-right text-green-700">
                          {t.success}
                        </td>
                        <td className="px-5 py-2.5 text-right text-red-700">
                          {t.failed}
                        </td>
                        <td className="px-5 py-2.5 text-right text-gray-700">
                          {(sr * 100).toFixed(1)}%
                        </td>
                        <td className="px-5 py-2.5 text-right text-gray-700">
                          {t.credits}
                        </td>
                        <td className="px-5 py-2.5">
                          <Bar percent={share * 100} />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white">
            <div className="border-b border-gray-100 px-5 py-3 text-sm font-medium text-gray-900">
              按用户（Top 20）
            </div>
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="px-5 py-2.5 font-normal">用户名</th>
                  <th className="px-5 py-2.5 text-right font-normal">生成次数</th>
                  <th className="px-5 py-2.5 text-right font-normal">
                    消费积分
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.users.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-5 py-8 text-center text-gray-400">
                      该区间暂无数据
                    </td>
                  </tr>
                ) : (
                  data.users.map((u) => (
                    <tr key={u.userId} className="border-t border-gray-100">
                      <td className="px-5 py-2.5 text-gray-900">{u.username}</td>
                      <td className="px-5 py-2.5 text-right text-gray-700">
                        {u.total}
                      </td>
                      <td className="px-5 py-2.5 text-right text-gray-700">
                        {u.credits}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </section>
        </>
      )}
    </div>
  );
}

function Card({
  label,
  value,
  accent,
}: {
  label: string;
  value: number | string;
  accent?: "green" | "red";
}) {
  const color =
    accent === "green"
      ? "text-green-700"
      : accent === "red"
        ? "text-red-700"
        : "text-gray-900";
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5">
      <div className="text-sm text-gray-500">{label}</div>
      <div className={`mt-1 text-3xl font-semibold ${color}`}>{value}</div>
    </div>
  );
}

function Bar({ percent }: { percent: number }) {
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full bg-gray-700"
          style={{ width: `${clamped}%` }}
        />
      </div>
      <span className="w-10 text-right text-xs text-gray-500">
        {clamped.toFixed(0)}%
      </span>
    </div>
  );
}
