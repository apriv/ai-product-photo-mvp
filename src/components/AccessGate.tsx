"use client";

import {
  createContext,
  FormEvent,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  ACCESS_PASSWORD_FIELD,
  ACCESS_PASSWORD_STORAGE_KEY,
} from "@/lib/access-shared";

type AccessContextValue = {
  accessPassword: string;
  resetAccess: () => void;
};

const AccessContext = createContext<AccessContextValue | null>(null);

export function useAccess() {
  const ctx = useContext(AccessContext);
  if (!ctx) {
    throw new Error("useAccess must be used inside <AccessGate>");
  }
  return ctx;
}

export default function AccessGate({ children }: { children: ReactNode }) {
  const [accessPassword, setAccessPassword] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      const saved = localStorage.getItem(ACCESS_PASSWORD_STORAGE_KEY);
      if (!saved) return;
      setAccessPassword(saved);

      fetch("/api/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [ACCESS_PASSWORD_FIELD]: saved }),
      })
        .then(async (response) => {
          const data = await response.json();
          if (!response.ok || !data.success) {
            throw new Error(data.error || "访问密码错误");
          }
          setIsUnlocked(true);
        })
        .catch(() => {
          localStorage.removeItem(ACCESS_PASSWORD_STORAGE_KEY);
          setAccessPassword("");
        });
    });

    return () => window.cancelAnimationFrame(frameId);
  }, []);

  const resetAccess = useCallback(() => {
    localStorage.removeItem(ACCESS_PASSWORD_STORAGE_KEY);
    setIsUnlocked(false);
    setAccessPassword("");
  }, []);

  const handleUnlock = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!accessPassword) {
      setError("请输入访问密码");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [ACCESS_PASSWORD_FIELD]: accessPassword }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "访问密码错误");
      }

      localStorage.setItem(ACCESS_PASSWORD_STORAGE_KEY, accessPassword);
      setIsUnlocked(true);
    } catch (err) {
      localStorage.removeItem(ACCESS_PASSWORD_STORAGE_KEY);
      setError(err instanceof Error ? err.message : "访问密码错误");
    } finally {
      setLoading(false);
    }
  };

  if (!isUnlocked) {
    return (
      <main className="min-h-screen bg-gray-50 px-6 py-10">
        <div className="mx-auto max-w-md rounded-2xl bg-white p-8 shadow">
          <h1 className="text-3xl font-bold text-gray-900">电商AI助手</h1>
          <form onSubmit={handleUnlock} className="mt-8">
            <label
              htmlFor="access-password"
              className="text-sm font-medium text-gray-700"
            >
              访问密码
            </label>
            <input
              id="access-password"
              type="password"
              value={accessPassword}
              onChange={(event) => {
                setAccessPassword(event.target.value);
                setError("");
              }}
              className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-black"
              autoComplete="current-password"
            />
            {error && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="mt-6 w-full rounded-xl bg-black py-3 font-medium text-white disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              {loading ? "校验中..." : "进入"}
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <AccessContext.Provider value={{ accessPassword, resetAccess }}>
      {children}
    </AccessContext.Provider>
  );
}
