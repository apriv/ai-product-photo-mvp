import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  AuthError,
  createSession,
  validatePassword,
  validateUsername,
  verifyPassword,
} from "@/lib/auth";
import logger from "@/lib/logger";
import { createRequestId, getRequestMeta } from "@/lib/request-meta";

export async function POST(request: Request) {
  const requestId = createRequestId();
  const meta = getRequestMeta(request, requestId);

  try {
    const body = await request.json();
    const username = validateUsername(String(body?.username ?? "").trim());
    const password = validatePassword(String(body?.password ?? ""));

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      throw new AuthError("用户名或密码错误", 401);
    }

    await createSession(user.id, {
      ip: meta.ip,
      userAgent: meta.userAgent,
    });
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    logger.info("login success", { ...meta, userId: user.id, username });
    return NextResponse.json({
      success: true,
      user: { id: user.id, username: user.username, role: user.role },
    });
  } catch (error) {
    const status = error instanceof AuthError ? error.status : 500;
    const message =
      error instanceof Error ? error.message : "登录失败，请重试";
    logger.warn("login failed", { ...meta, status, message });
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
