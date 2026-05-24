import "server-only";
import { prisma } from "@/lib/prisma";
import type { LedgerReason } from "@/generated/prisma/enums";

export class InsufficientCreditsError extends Error {
  status = 402;
  balance: number;
  required: number;
  constructor(balance: number, required: number) {
    super("积分不足");
    this.balance = balance;
    this.required = required;
  }
}

export class PlanExpiredError extends Error {
  status = 402;
  constructor() {
    super("套餐已到期，请激活新的月卡");
  }
}

export type ChargeContext = {
  reason: LedgerReason;
  refId?: string;
};

// Atomic charge: read balance under transaction, verify plan validity,
// deduct, write a ledger row. Throws on insufficient balance or expired
// plan so the caller (route handler) can convert to an HTTP response.
//
// Plan-expired check: if a wallet has activePlanId but planExpiresAt is
// in the past, refuse to charge. Topup-only credits (no activePlanId)
// are unaffected.
export async function chargeCredits(
  userId: string,
  amount: number,
  ctx: ChargeContext
) {
  if (amount < 0) throw new Error("charge amount must be non-negative");
  if (amount === 0) return { balance: await currentBalance(userId), delta: 0 };

  return prisma.$transaction(async (tx) => {
    const wallet = await tx.creditWallet.findUnique({ where: { userId } });
    if (!wallet) throw new InsufficientCreditsError(0, amount);

    if (
      wallet.activePlanId &&
      wallet.planExpiresAt &&
      wallet.planExpiresAt.getTime() < Date.now()
    ) {
      throw new PlanExpiredError();
    }

    if (wallet.balance < amount) {
      throw new InsufficientCreditsError(wallet.balance, amount);
    }

    const newBalance = wallet.balance - amount;
    await tx.creditWallet.update({
      where: { userId },
      data: { balance: newBalance },
    });
    await tx.creditLedger.create({
      data: {
        userId,
        delta: -amount,
        reason: ctx.reason,
        refId: ctx.refId ?? null,
        balanceAfter: newBalance,
      },
    });

    return { balance: newBalance, delta: -amount };
  });
}

async function currentBalance(userId: string) {
  const w = await prisma.creditWallet.findUnique({ where: { userId } });
  return w?.balance ?? 0;
}
