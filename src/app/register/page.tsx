"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [activationCode, setActivationCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, activationCode }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "注册失败");
      }
      router.replace("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "注册失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-md rounded-2xl bg-white p-8 shadow">
        <h1 className="text-3xl font-bold text-gray-900">注册</h1>
        <p className="mt-2 text-sm text-gray-500">
          需要激活码才能注册，激活码请在外部平台购买
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label className="text-sm font-medium text-gray-700">用户名</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-black"
            />
            <p className="mt-1 text-xs text-gray-500">
              3-20 个字符，字母 / 数字 / 下划线
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-black"
            />
            <p className="mt-1 text-xs text-gray-500">至少 6 位</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">激活码</label>
            <input
              type="text"
              value={activationCode}
              onChange={(e) => setActivationCode(e.target.value.toUpperCase())}
              className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 font-mono outline-none transition focus:border-black"
              placeholder="STD-XXXXXXXXXXXX"
            />
          </div>
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-black py-3 font-medium text-white disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {loading ? "注册中..." : "注册并激活"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          已有账号？{" "}
          <Link href="/login" className="text-black underline">
            去登录
          </Link>
        </p>
      </div>
    </main>
  );
}
