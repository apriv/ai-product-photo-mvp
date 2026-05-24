import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { adminAdjustCredits } from "@/lib/admin";
import { errorResponse } from "@/lib/api-errors";
import logger from "@/lib/logger";
import { createRequestId, getRequestMeta } from "@/lib/request-meta";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = createRequestId();
  const meta = getRequestMeta(request, requestId);

  try {
    const actor = await requireAdmin();
    const { id: targetUserId } = await params;
    const body = await request.json();
    const delta = Number(body?.delta);
    const reason = String(body?.reason ?? "");

    const result = await adminAdjustCredits({
      actorId: actor.id,
      targetUserId,
      delta,
      reason,
    });

    logger.info("admin adjust", {
      ...meta,
      actorId: actor.id,
      targetUserId,
      delta,
      reason,
      newBalance: result.balance,
    });

    return NextResponse.json({
      success: true,
      balance: result.balance,
      delta: result.delta,
    });
  } catch (error) {
    return errorResponse(error, meta);
  }
}
