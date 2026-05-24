import { NextResponse } from "next/server";
import { AuthError } from "@/lib/auth";
import { AdminOperationError } from "@/lib/admin";
import {
  InsufficientCreditsError,
  PlanExpiredError,
} from "@/lib/credits";
import { ActivationError } from "@/lib/activation";
import logger from "@/lib/logger";

type KnownError =
  | AuthError
  | AdminOperationError
  | InsufficientCreditsError
  | PlanExpiredError
  | ActivationError;

function isKnown(err: unknown): err is KnownError {
  return (
    err instanceof AuthError ||
    err instanceof AdminOperationError ||
    err instanceof InsufficientCreditsError ||
    err instanceof PlanExpiredError ||
    err instanceof ActivationError
  );
}

// Centralised conversion of business-layer exceptions into JSON
// responses. Anything unknown is logged with stack and returned as
// 500 with a generic message.
export function errorResponse(error: unknown, logCtx: object = {}) {
  if (isKnown(error)) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: (error as { status?: number }).status ?? 400 }
    );
  }
  const message = error instanceof Error ? error.message : "服务器错误";
  const stack = error instanceof Error ? error.stack : undefined;
  logger.error("unhandled API error", { ...logCtx, error: message, stack });
  return NextResponse.json(
    { success: false, error: "服务器错误" },
    { status: 500 }
  );
}
