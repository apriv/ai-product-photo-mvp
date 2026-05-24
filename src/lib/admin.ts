import "server-only";
import { prisma } from "@/lib/prisma";

export class AdminOperationError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

// Manually adjust a user's balance. `delta` may be positive or negative.
// Always writes an ADMIN_ADJUST row in the ledger with `refId = "<actorId>:<reason>"`
// so it stays auditable.
export async function adminAdjustCredits(opts: {
  actorId: string;
  targetUserId: string;
  delta: number;
  reason: string;
}) {
  const { actorId, targetUserId, delta, reason } = opts;

  if (!Number.isFinite(delta) || delta === 0 || !Number.isInteger(delta)) {
    throw new AdminOperationError("delta 必须是非零整数");
  }
  if (Math.abs(delta) > 1_000_000) {
    throw new AdminOperationError("delta 超出合理范围");
  }
  const cleanedReason = reason.trim();
  if (cleanedReason.length < 2 || cleanedReason.length > 200) {
    throw new AdminOperationError("调整原因需 2-200 字符");
  }

  return prisma.$transaction(async (tx) => {
    const wallet =
      (await tx.creditWallet.findUnique({ where: { userId: targetUserId } })) ??
      (await tx.creditWallet.create({ data: { userId: targetUserId } }));

    const newBalance = wallet.balance + delta;
    if (newBalance < 0) {
      throw new AdminOperationError(
        `调整后余额会变负数（当前 ${wallet.balance} + ${delta}）`
      );
    }

    await tx.creditWallet.update({
      where: { userId: targetUserId },
      data: { balance: newBalance },
    });

    await tx.creditLedger.create({
      data: {
        userId: targetUserId,
        delta,
        reason: "ADMIN_ADJUST",
        refId: `${actorId}:${cleanedReason}`,
        balanceAfter: newBalance,
      },
    });

    return { balance: newBalance, delta };
  });
}
