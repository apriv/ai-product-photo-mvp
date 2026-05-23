import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AuthError, requireUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await requireUser();
    const wallet = await prisma.creditWallet.findUnique({
      where: { userId: user.id },
      include: { user: { select: { username: true, role: true } } },
    });
    const recentLedger = await prisma.creditLedger.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
    });
    return NextResponse.json({
      success: true,
      user: { id: user.id, username: user.username, role: user.role },
      wallet: wallet
        ? {
            balance: wallet.balance,
            activePlanId: wallet.activePlanId,
            planExpiresAt: wallet.planExpiresAt,
            nextRefillAt: wallet.nextRefillAt,
          }
        : { balance: 0, activePlanId: null, planExpiresAt: null, nextRefillAt: null },
      recentLedger,
    });
  } catch (error) {
    const status = error instanceof AuthError ? error.status : 500;
    const message =
      error instanceof Error ? error.message : "读取账户失败";
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
