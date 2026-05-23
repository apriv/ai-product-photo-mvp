import "server-only";
import { prisma } from "@/lib/prisma";

const REFILL_INTERVAL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export class ActivationError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export function normalizeActivationCode(raw: string) {
  return raw.trim().toUpperCase();
}

// Apply an activation code to a user inside a transaction:
//  - Lock the code (status=USED)
//  - Create wallet if missing
//  - For MONTHLY: set activePlan, planExpiresAt, nextRefillAt; add monthlyCredits
//  - For TOPUP: add topupCredits (no plan change)
//  - Write CreditLedger
export async function applyActivationCode(userId: string, codeInput: string) {
  const code = normalizeActivationCode(codeInput);
  if (!code) throw new ActivationError("请输入激活码");

  return prisma.$transaction(async (tx) => {
    const activation = await tx.activationCode.findUnique({
      where: { code },
      include: { plan: true },
    });

    if (!activation) throw new ActivationError("激活码无效");
    if (activation.status !== "UNUSED") {
      throw new ActivationError("激活码已被使用或已禁用");
    }
    if (!activation.plan.active) {
      throw new ActivationError("套餐已下架，请联系客服");
    }

    const wallet =
      (await tx.creditWallet.findUnique({ where: { userId } })) ??
      (await tx.creditWallet.create({ data: { userId } }));

    const now = new Date();
    let delta = 0;
    let newBalance = wallet.balance;
    const updates: Parameters<typeof tx.creditWallet.update>[0]["data"] = {};

    if (activation.plan.kind === "MONTHLY") {
      delta = activation.plan.monthlyCredits;
      newBalance += delta;
      updates.balance = newBalance;
      updates.activePlanId = activation.plan.id;
      updates.planExpiresAt = new Date(now.getTime() + REFILL_INTERVAL_MS);
      updates.nextRefillAt = new Date(now.getTime() + REFILL_INTERVAL_MS);
    } else if (activation.plan.kind === "TOPUP") {
      delta = activation.plan.topupCredits;
      newBalance += delta;
      updates.balance = newBalance;
    }

    await tx.creditWallet.update({ where: { userId }, data: updates });

    await tx.activationCode.update({
      where: { code },
      data: {
        status: "USED",
        usedByUserId: userId,
        usedAt: now,
      },
    });

    await tx.creditLedger.create({
      data: {
        userId,
        delta,
        reason: "ACTIVATION",
        refId: code,
        balanceAfter: newBalance,
      },
    });

    return { delta, balance: newBalance, plan: activation.plan };
  });
}
