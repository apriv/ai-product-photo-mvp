import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin");
  if (user.role !== "ADMIN") redirect("/");

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="text-lg font-semibold text-gray-900">
              管理后台
            </Link>
            <nav className="flex gap-4 text-sm text-gray-600">
              <Link href="/admin/users" className="hover:text-black">
                用户
              </Link>
              <Link href="/admin/codes" className="hover:text-black">
                激活码
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>{user.username}</span>
            <Link href="/" className="hover:text-black">
              ← 返回站点
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
