import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  AuthError,
  createSession,
  hashPassword,
  validatePassword,
  validateUsername,
} from "@/lib/auth";
import { ActivationError, applyActivationCode } from "@/lib/activation";
import logger from "@/lib/logger";
import { createRequestId, getRequestMeta } from "@/lib/request-meta";

export async function POST(request: Request) {
  const requestId = createRequestId();
  const meta = getRequestMeta(request, requestId);

  try {
    const body = await request.json();
    const username = validateUsername(String(body?.username ?? "").trim());
    const password = validatePassword(String(body?.password ?? ""));
    const activationCode = String(body?.activationCode ?? "").trim();
    if (!activationCode) {
      throw new ActivationError("请输入激活码");
    }

    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
      throw new AuthError("用户名已被占用", 409);
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        username,
        passwordHash,
        wallet: { create: {} },
      },
    });

    try {
      await applyActivationCode(user.id, activationCode);
    } catch (activationErr) {
      // Roll back the user we just created so they can retry with a valid code.
      await prisma.user.delete({ where: { id: user.id } }).catch(() => {});
      throw activationErr;
    }

    await createSession(user.id, {
      ip: meta.ip,
      userAgent: meta.userAgent,
    });

    logger.info("register success", { ...meta, userId: user.id, username });
    return NextResponse.json({
      success: true,
      user: { id: user.id, username: user.username, role: user.role },
    });
  } catch (error) {
    const status =
      error instanceof AuthError || error instanceof ActivationError
        ? error.status
        : 500;
    const message =
      error instanceof Error ? error.message : "注册失败，请重试";
    logger.warn("register failed", { ...meta, status, message });
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
