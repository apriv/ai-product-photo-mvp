"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

type Plan = {
  id: string;
  name: string;
  monthlyCredits: number;
  topupCredits: number;
  kind: "MONTHLY" | "TOPUP";
  active: boolean;
};

type Code = {
  code: string;
  status: "UNUSED" | "USED" | "DISABLED";
  createdAt: string;
  usedAt: string | null;
  note: string | null;
  plan: { id: string; name: string };
  usedBy: { id: string; username: string } | null;
};

type Status = "UNUSED" | "USED" | "DISABLED";

export default function AdminCodesPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [status, setStatus] = useState<Status>("UNUSED");
  const [codes, setCodes] = useState<Code[]>([]);
  const [total, setTotal] = useState(0);
  const [showGenerator, setShowGenerator] = useState(false);
  const [lastGenerated, setLastGenerated] = useState<string[] | null>(null);

  const loadPlans = useCallback(async () => {
    const r = await fetch("/api/admin/plans", { cache: "no-store" });
    const data = await r.json();
    if (data.success) setPlans(data.plans);
  }, []);

  const loadCodes = useCallback(async () => {
    const r = await fetch(`/api/admin/codes?status=${status}`, {
      cache: "no-store",
    });
    const data = await r.json();
    if (data.success) {
      setCodes(data.codes);
      setTotal(data.total);
    }
  }, [status]);

  useEffect(() => {
    const id = window.requestAnimationFrame(() => {
      loadPlans();
      loadCodes();
    });
    return () => window.cancelAnimationFrame(id);
  }, [loadPlans, loadCodes]);

  function exportCsv() {
    const header = "code,plan,status,used_by,used_at,created_at,note";
    const rows = codes.map((c) =>
      [
        c.code,
        c.plan.id,
        c.status,
        c.usedBy?.username ?? "",
        c.usedAt ? new Date(c.usedAt).toISOString() : "",
        new Date(c.createdAt).toISOString(),
        (c.note ?? "").replace(/[\r\n,]/g, " "),
      ].join(",")
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `codes-${status.toLowerCase()}-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-bold text-gray-900">激活码</h1>
        <div className="flex items-center gap-2 text-sm">
          <button
            onClick={() => setShowGenerator(true)}
            className="rounded-xl bg-black px-4 py-2 text-white"
          >
            + 生成激活码
          </button>
          <button
            onClick={exportCsv}
            className="rounded-xl border border-gray-300 px-4 py-2 text-gray-700"
          >
            导出 CSV
          </button>
        </div>
      </div>

      <div className="flex gap-2 text-sm">
        {(["UNUSED", "USED", "DISABLED"] as Status[]).map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`rounded-lg px-3 py-1.5 ${
              status === s
                ? "bg-black text-white"
                : "border border-gray-200 text-gray-600 hover:border-black"
            }`}
          >
            {s === "UNUSED" ? "未使用" : s === "USED" ? "已使用" : "已禁用"}
          </button>
        ))}
        <span className="ml-3 self-center text-gray-500">共 {total} 条</span>
      </div>

      {lastGenerated && (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm">
          <div className="flex items-baseline justify-between">
            <div className="font-medium text-green-800">
              本次生成 {lastGenerated.length} 个码：
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(lastGenerated.join("\n"));
              }}
              className="text-xs text-green-800 underline"
            >
              复制全部
            </button>
          </div>
          <pre className="mt-2 max-h-48 overflow-y-auto font-mono text-xs text-gray-800">
            {lastGenerated.join("\n")}
          </pre>
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="px-4 py-3 font-normal">激活码</th>
              <th className="px-4 py-3 font-normal">套餐</th>
              <th className="px-4 py-3 font-normal">使用者</th>
              <th className="px-4 py-3 font-normal">使用时间</th>
              <th className="px-4 py-3 font-normal">创建时间</th>
              <th className="px-4 py-3 font-normal">备注</th>
            </tr>
          </thead>
          <tbody>
            {codes.map((c) => (
              <tr key={c.code} className="border-t border-gray-100">
                <td className="px-4 py-3 font-mono text-xs text-gray-900">
                  <button
                    onClick={() => navigator.clipboard.writeText(c.code)}
                    title="点击复制"
                    className="hover:underline"
                  >
                    {c.code}
                  </button>
                </td>
                <td className="px-4 py-3 text-gray-600">{c.plan.id}</td>
                <td className="px-4 py-3 text-gray-600">
                  {c.usedBy?.username ?? "—"}
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {c.usedAt
                    ? new Date(c.usedAt).toLocaleString("zh-CN")
                    : "—"}
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {new Date(c.createdAt).toLocaleDateString("zh-CN")}
                </td>
                <td className="px-4 py-3 text-gray-500">{c.note ?? "—"}</td>
              </tr>
            ))}
            {codes.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-10 text-center text-sm text-gray-400"
                >
                  无结果
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showGenerator && (
        <GeneratorDialog
          plans={plans}
          onClose={() => setShowGenerator(false)}
          onDone={(codes) => {
            setShowGenerator(false);
            setLastGenerated(codes);
            if (status === "UNUSED") loadCodes();
          }}
        />
      )}
    </div>
  );
}

function GeneratorDialog({
  plans,
  onClose,
  onDone,
}: {
  plans: Plan[];
  onClose: () => void;
  onDone: (codes: string[]) => void;
}) {
  const activePlans = plans.filter((p) => p.active);
  const [planId, setPlanId] = useState(activePlans[0]?.id ?? "");
  const [count, setCount] = useState("1");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const r = await fetch("/api/admin/codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId,
          count: Number(count),
          note: note || null,
        }),
      });
      const data = await r.json();
      if (!r.ok || !data.success) {
        throw new Error(data.error || "生成失败");
      }
      onDone(data.codes);
    } catch (err) {
      setError(err instanceof Error ? err.message : "生成失败");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-10 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-gray-900">生成激活码</h2>
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">套餐</label>
            <select
              value={planId}
              onChange={(e) => setPlanId(e.target.value)}
              className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-2 outline-none focus:border-black"
            >
              {activePlans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.id} — {p.name} (
                  {p.kind === "MONTHLY"
                    ? `${p.monthlyCredits} 月度积分`
                    : `${p.topupCredits} 补充积分`}
                  )
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">
              数量（1-1000）
            </label>
            <input
              type="number"
              value={count}
              onChange={(e) => setCount(e.target.value)}
              min={1}
              max={1000}
              className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-2 outline-none focus:border-black"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">
              备注（可选）
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="例如：3月淘宝批次"
              className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-2 outline-none focus:border-black"
            />
          </div>
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gray-300 px-4 py-2 text-sm text-gray-700"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={busy || !planId}
              className="rounded-xl bg-black px-5 py-2 text-sm text-white disabled:bg-gray-300"
            >
              {busy ? "生成中..." : "生成"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
