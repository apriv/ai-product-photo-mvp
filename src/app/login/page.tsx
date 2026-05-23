import { Suspense } from "react";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-md rounded-2xl bg-white p-8 shadow">
        <h1 className="text-3xl font-bold text-gray-900">登录</h1>
        <p className="mt-2 text-sm text-gray-500">电商 AI 助手</p>
        <Suspense fallback={<div className="mt-8 text-sm text-gray-500">加载中...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
