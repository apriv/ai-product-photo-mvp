"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

type AdminUser = {
  id: string;
  username: string;
  role: "USER" | "ADMIN";
  createdAt: string;
  lastLoginAt: string | null;
  balance: number;
  activePlanId: string | null;
  planExpiresAt: string | null;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<AdminUser | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(
        `/api/admin/users?q=${encodeURIComponent(q)}`,
        { cache: "no-store" }
      );
      const data = await r.json();
      if (data.success) {
        setUsers(data.users);
        setTotal(data.total);
      }
    } finally {
      setLoading(false);
    }
  }, [q]);

  useEffect(() => {
    const id = window.requestAnimationFrame(() => {
      load();
    });
    return () => window.cancelAnimationFrame(id);
  }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-bold text-gray-900">用户</h1>
        <div className="text-sm text-gray-500">共 {total} 个用户</div>
      </div>

      <div className="flex gap-3">
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") load();
          }}
          placeholder="按用户名搜索"
          className="flex-1 rounded-xl border border-gray-300 px-4 py-2 outline-none focus:border-black"
        />
        <button
          onClick={load}
          className="rounded-xl bg-black px-5 py-2 text-white"
        >
          搜索
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="px-4 py-3 font-normal">用户名</th>
              <th className="px-4 py-3 font-normal">角色</th>
              <th className="px-4 py-3 text-right font-normal">余额</th>
              <th className="px-4 py-3 font-normal">套餐</th>
              <th className="px-4 py-3 font-normal">到期</th>
              <th className="px-4 py-3 font-normal">注册时间</th>
              <th className="px-4 py-3 font-normal"></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-gray-100">
                <td className="px-4 py-3 text-gray-900">{u.username}</td>
                <td className="px-4 py-3 text-gray-600">
                  {u.role === "ADMIN" ? (
                    <span className="rounded bg-black px-2 py-0.5 text-xs text-white">
                      ADMIN
                    </span>
                  ) : (
                    "用户"
                  )}
                </td>
                <td className="px-4 py-3 text-right font-medium text-gray-900">
                  {u.balance}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {u.activePlanId ?? "—"}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {u.planExpiresAt
                    ? new Date(u.planExpiresAt).toLocaleDateString("zh-CN")
                    : "—"}
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {new Date(u.createdAt).toLocaleDateString("zh-CN")}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => setEditing(u)}
                    className="text-sm text-gray-600 underline hover:text-black"
                  >
                    调额度
                  </button>
                </td>
              </tr>
            ))}
            {users.length === 0 && !loading && (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-10 text-center text-sm text-gray-400"
                >
                  无结果
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <AdjustDialog
          user={editing}
          onClose={() => setEditing(null)}
          onDone={() => {
            setEditing(null);
            load();
          }}
        />
      )}
    </div>
  );
}

function AdjustDialog({
  user,
  onClose,
  onDone,
}: {
  user: AdminUser;
  onClose: () => void;
  onDone: () => void;
}) {
  const [delta, setDelta] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const r = await fetch(`/api/admin/users/${user.id}/adjust`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ delta: Number(delta), reason }),
      });
      const data = await r.json();
      if (!r.ok || !data.success) {
        throw new Error(data.error || "调整失败");
      }
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "调整失败");
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
        <h2 className="text-lg font-semibold text-gray-900">
          调整 {user.username} 的余额
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          当前余额：<span className="font-medium">{user.balance}</span>
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">
              变动量 (delta)
            </label>
            <input
              type="number"
              value={delta}
              onChange={(e) => setDelta(e.target.value)}
              placeholder="正数=加，负数=减，如 100 或 -50"
              className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-2 outline-none focus:border-black"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">
              调整原因（必填）
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="例如：补偿生成失败 / 测试 / 客服赠送"
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
              disabled={busy}
              className="rounded-xl bg-black px-5 py-2 text-sm text-white disabled:bg-gray-300"
            >
              {busy ? "调整中..." : "确认调整"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
