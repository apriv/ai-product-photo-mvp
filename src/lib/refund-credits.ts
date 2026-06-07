import "server-only";
import { prisma } from "@/lib/prisma";
import logger from "@/lib/logger";

export async function refundCredits(
  userId: string,
  amount: number,
  refId: string
) {
  if (amount <= 0) return;

  try {
    await prisma.$transaction(async (tx) => {
      const wallet = await tx.creditWallet.findUnique({ where: { userId } });
      if (!wallet) return;
      const balance = wallet.balance + amount;
      await tx.creditWallet.update({
        where: { userId },
        data: { balance },
      });
      await tx.creditLedger.create({
        data: {
          userId,
          delta: amount,
          reason: "REFUND",
          refId,
          balanceAfter: balance,
        },
      });
    });
  } catch (error) {
    logger.error("refund failed", {
      userId,
      amount,
      refId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
