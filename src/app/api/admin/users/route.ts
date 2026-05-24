import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { errorResponse } from "@/lib/api-errors";

const PAGE_SIZE = 50;

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const url = new URL(request.url);
    const q = url.searchParams.get("q")?.trim() ?? "";
    const page = Math.max(1, Number.parseInt(url.searchParams.get("page") ?? "1", 10) || 1);

    const where = q
      ? { username: { contains: q } }
      : undefined;

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        include: { wallet: true },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
    ]);

    return NextResponse.json({
      success: true,
      page,
      pageSize: PAGE_SIZE,
      total,
      users: users.map((u) => ({
        id: u.id,
        username: u.username,
        role: u.role,
        createdAt: u.createdAt,
        lastLoginAt: u.lastLoginAt,
        balance: u.wallet?.balance ?? 0,
        activePlanId: u.wallet?.activePlanId ?? null,
        planExpiresAt: u.wallet?.planExpiresAt ?? null,
      })),
    });
  } catch (error) {
    return errorResponse(error);
  }
}
