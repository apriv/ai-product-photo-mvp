import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { errorResponse } from "@/lib/api-errors";

const VALID_RANGES = ["1d", "7d", "30d", "all"] as const;
type Range = (typeof VALID_RANGES)[number];

function rangeStart(range: Range): Date | null {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  switch (range) {
    case "1d":
      return new Date(now - day);
    case "7d":
      return new Date(now - 7 * day);
    case "30d":
      return new Date(now - 30 * day);
    case "all":
      return null;
  }
}

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const url = new URL(request.url);
    const rangeParam = url.searchParams.get("range") ?? "7d";
    const range = (VALID_RANGES as readonly string[]).includes(rangeParam)
      ? (rangeParam as Range)
      : "7d";
    const since = rangeStart(range);
    const where = since ? { createdAt: { gte: since } } : {};

    // Overall totals
    const [overallByStatus, byTemplate, topUsers] = await Promise.all([
      // success/fail totals + sum of credits spent (success only)
      prisma.generationLog.groupBy({
        by: ["status"],
        where,
        _count: { _all: true },
        _sum: { cost: true },
      }),
      // per-template breakdown with status split
      prisma.generationLog.groupBy({
        by: ["template", "status"],
        where,
        _count: { _all: true },
        _sum: { cost: true },
      }),
      // top users by number of generations (any status)
      prisma.generationLog.groupBy({
        by: ["userId"],
        where,
        _count: { _all: true },
        _sum: { cost: true },
        orderBy: { _count: { userId: "desc" } },
        take: 20,
      }),
    ]);

    const totalSuccess =
      overallByStatus.find((r) => r.status === "SUCCESS")?._count._all ?? 0;
    const totalFailed =
      overallByStatus.find((r) => r.status === "FAILED")?._count._all ?? 0;
    const totalCreditsSpent =
      overallByStatus.find((r) => r.status === "SUCCESS")?._sum.cost ?? 0;
    const total = totalSuccess + totalFailed;

    // Roll up per-template
    const templateMap = new Map<
      string,
      { template: string; success: number; failed: number; credits: number }
    >();
    for (const row of byTemplate) {
      const key = row.template;
      const entry =
        templateMap.get(key) ??
        { template: key, success: 0, failed: 0, credits: 0 };
      if (row.status === "SUCCESS") {
        entry.success += row._count._all;
        entry.credits += row._sum.cost ?? 0;
      } else {
        entry.failed += row._count._all;
      }
      templateMap.set(key, entry);
    }
    const templates = Array.from(templateMap.values()).sort(
      (a, b) => b.success + b.failed - (a.success + a.failed)
    );

    // Hydrate top user IDs to usernames
    const userIds = topUsers.map((u) => u.userId);
    const users = userIds.length
      ? await prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, username: true },
        })
      : [];
    const userMap = new Map(users.map((u) => [u.id, u.username]));

    const usersResult = topUsers.map((u) => ({
      userId: u.userId,
      username: userMap.get(u.userId) ?? "(已删除)",
      total: u._count._all,
      credits: u._sum.cost ?? 0,
    }));

    return NextResponse.json({
      success: true,
      range,
      since: since?.toISOString() ?? null,
      overall: {
        total,
        success: totalSuccess,
        failed: totalFailed,
        successRate: total === 0 ? null : totalSuccess / total,
        creditsSpent: totalCreditsSpent,
      },
      templates,
      users: usersResult,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
