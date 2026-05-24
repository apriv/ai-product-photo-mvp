"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Wallet = {
  balance: number;
  activePlanId: string | null;
  planExpiresAt: string | null;
  nextRefillAt: string | null;
};

type LedgerEntry = {
  id: string;
  delta: number;
  reason: string;
  refId: string | null;
  balanceAfter: number;
  createdAt: string;
};

type AccountData = {
  user: { id: string; username: string; role: string };
  wallet: Wallet;
  recentLedger: LedgerEntry[];
};

export default function AccountPage() {
  const router = useRouter();
  const [data, setData] = useState<AccountData | null>(null);
  const [error, setError] = useState("");
  const [code, setCode] = useState("");
  const [activating, setActivating] = useState(false);
  const [activateMsg, setActivateMsg] = useState("");

  const load = useCallback(async () => {
    setError("");
    const response = await fetch("/api/account/wallet", { cache: "no-store" });
    if (response.status === 401) {
      router.replace("/login");
      return;
    }
    const json = await response.json();
    if (!json.success) {
      setError(json.error || "读取失败");
      return;
    }
    setData(json);
  }, [router]);

  useEffect(() => {
    const id = window.requestAnimationFrame(() => {
      load();
    });
    return () => window.cancelAnimationFrame(id);
  }, [load]);

  async function handleActivate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setActivating(true);
    setActivateMsg("");
    try {
      const response = await fetch("/api/account/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activationCode: code }),
      });
      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json.error || "激活失败");
      }
      setActivateMsg(`激活成功，+${json.delta} 积分`);
      setCode("");
      await load();
    } catch (err) {
      setActivateMsg(err instanceof Error ? err.message : "激活失败");
    } finally {
      setActivating(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gray-50 px-6 py-10">
        <div className="mx-auto max-w-2xl rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
          {error}
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="min-h-screen bg-gray-50 px-6 py-10">
        <div className="mx-auto max-w-2xl text-gray-500">加载中...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">账户</h1>
          <Link href="/" className="text-sm text-gray-500 hover:text-black">
            ← 返回首页
          </Link>
        </div>

        <section className="rounded-2xl bg-white p-6 shadow">
          <div className="flex items-baseline justify-between">
            <div>
              <div className="text-sm text-gray-500">用户名</div>
              <div className="text-lg font-medium text-gray-900">
                {data.user.username}
                {data.user.role === "ADMIN" && (
                  <span className="ml-2 rounded bg-black px-2 py-0.5 text-xs text-white">
                    ADMIN
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm">
              {data.user.role === "ADMIN" && (
                <Link
                  href="/admin"
                  className="rounded-lg bg-black px-3 py-1.5 text-white"
                >
                  管理后台
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="text-gray-500 underline hover:text-black"
              >
                退出登录
              </button>
            </div>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow">
          <h2 className="text-lg font-semibold text-gray-900">钱包</h2>
          <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-gray-500">余额</div>
              <div className="text-2xl font-semibold text-gray-900">
                {data.wallet.balance}
              </div>
            </div>
            <div>
              <div className="text-gray-500">当前套餐</div>
              <div className="font-medium text-gray-900">
                {data.wallet.activePlanId ?? "—"}
              </div>
            </div>
            <div>
              <div className="text-gray-500">套餐到期</div>
              <div className="font-medium text-gray-900">
                {data.wallet.planExpiresAt
                  ? new Date(data.wallet.planExpiresAt).toLocaleDateString(
                      "zh-CN"
                    )
                  : "—"}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow">
          <h2 className="text-lg font-semibold text-gray-900">激活套餐 / 补充包</h2>
          <form onSubmit={handleActivate} className="mt-4 flex gap-3">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="STD-XXXXXXXXXXXX"
              className="flex-1 rounded-xl border border-gray-300 px-4 py-2 font-mono outline-none focus:border-black"
            />
            <button
              type="submit"
              disabled={activating || !code}
              className="rounded-xl bg-black px-5 py-2 text-white disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              {activating ? "激活中..." : "激活"}
            </button>
          </form>
          {activateMsg && (
            <p className="mt-3 text-sm text-gray-600">{activateMsg}</p>
          )}
        </section>

        <section className="rounded-2xl bg-white p-6 shadow">
          <h2 className="text-lg font-semibold text-gray-900">最近流水</h2>
          {data.recentLedger.length === 0 ? (
            <p className="mt-4 text-sm text-gray-500">暂无记录</p>
          ) : (
            <table className="mt-4 w-full text-left text-sm">
              <thead className="text-gray-500">
                <tr>
                  <th className="pb-2 font-normal">时间</th>
                  <th className="pb-2 font-normal">原因</th>
                  <th className="pb-2 font-normal text-right">变动</th>
                  <th className="pb-2 font-normal text-right">余额</th>
                </tr>
              </thead>
              <tbody>
                {data.recentLedger.map((entry) => (
                  <tr key={entry.id} className="border-t border-gray-100">
                    <td className="py-2 text-gray-600">
                      {new Date(entry.createdAt).toLocaleString("zh-CN")}
                    </td>
                    <td className="py-2 text-gray-900">{entry.reason}</td>
                    <td
                      className={`py-2 text-right font-medium ${
                        entry.delta >= 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {entry.delta >= 0 ? "+" : ""}
                      {entry.delta}
                    </td>
                    <td className="py-2 text-right text-gray-900">
                      {entry.balanceAfter}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </main>
  );
}
