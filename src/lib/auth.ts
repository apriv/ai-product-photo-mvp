import "server-only";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import type { UserModel } from "@/generated/prisma/models";
import { Role } from "@/generated/prisma/enums";

const SESSION_COOKIE = "session";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

const USERNAME_RE = /^[A-Za-z0-9_]{3,20}$/;
const MIN_PASSWORD_LEN = 6;

export class AuthError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.status = status;
  }
}

export function validateUsername(username: string): string {
  if (!USERNAME_RE.test(username)) {
    throw new AuthError(
      "用户名需为 3-20 个字符，仅支持字母、数字、下划线",
      400
    );
  }
  return username;
}

export function validatePassword(password: string): string {
  if (typeof password !== "string" || password.length < MIN_PASSWORD_LEN) {
    throw new AuthError(`密码至少 ${MIN_PASSWORD_LEN} 位`, 400);
  }
  return password;
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export type SessionContext = {
  ip?: string | null;
  userAgent?: string | null;
};

export async function createSession(userId: string, ctx: SessionContext = {}) {
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  const session = await prisma.session.create({
    data: {
      userId,
      expiresAt,
      ip: ctx.ip ?? null,
      userAgent: ctx.userAgent ?? null,
    },
  });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, session.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
  return session;
}

export async function destroyCurrentSession() {
  const jar = await cookies();
  const sid = jar.get(SESSION_COOKIE)?.value;
  if (sid) {
    await prisma.session.deleteMany({ where: { id: sid } }).catch(() => {});
    jar.delete(SESSION_COOKIE);
  }
}

export async function getCurrentUser(): Promise<UserModel | null> {
  const jar = await cookies();
  const sid = jar.get(SESSION_COOKIE)?.value;
  if (!sid) return null;

  const session = await prisma.session.findUnique({
    where: { id: sid },
    include: { user: true },
  });
  if (!session) return null;
  if (session.expiresAt.getTime() < Date.now()) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }
  return session.user;
}

export async function requireUser(): Promise<UserModel> {
  const user = await getCurrentUser();
  if (!user) throw new AuthError("未登录", 401);
  return user;
}

export async function requireAdmin(): Promise<UserModel> {
  const user = await requireUser();
  if (user.role !== Role.ADMIN) throw new AuthError("无权访问", 403);
  return user;
}
