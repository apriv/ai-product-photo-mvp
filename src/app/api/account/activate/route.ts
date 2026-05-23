import { NextResponse } from "next/server";
import { AuthError, requireUser } from "@/lib/auth";
import { ActivationError, applyActivationCode } from "@/lib/activation";
import logger from "@/lib/logger";
import { createRequestId, getRequestMeta } from "@/lib/request-meta";

export async function POST(request: Request) {
  const requestId = createRequestId();
  const meta = getRequestMeta(request, requestId);

  try {
    const user = await requireUser();
    const body = await request.json();
    const code = String(body?.activationCode ?? "").trim();

    const result = await applyActivationCode(user.id, code);
    logger.info("activation success", {
      ...meta,
      userId: user.id,
      code,
      delta: result.delta,
      balance: result.balance,
    });
    return NextResponse.json({
      success: true,
      balance: result.balance,
      delta: result.delta,
      planId: result.plan.id,
    });
  } catch (error) {
    const status =
      error instanceof AuthError || error instanceof ActivationError
        ? error.status
        : 500;
    const message =
      error instanceof Error ? error.message : "激活失败，请重试";
    logger.warn("activation failed", { ...meta, status, message });
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
