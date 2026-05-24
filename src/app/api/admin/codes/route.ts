import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatActivationCode } from "@/lib/activation-codes";
import { errorResponse } from "@/lib/api-errors";
import logger from "@/lib/logger";
import { createRequestId, getRequestMeta } from "@/lib/request-meta";

const PAGE_SIZE = 100;
const ALLOWED_STATUS = ["UNUSED", "USED", "DISABLED"] as const;
type Status = (typeof ALLOWED_STATUS)[number];

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const url = new URL(request.url);
    const statusParam = url.searchParams.get("status") ?? "UNUSED";
    const status = (ALLOWED_STATUS as readonly string[]).includes(statusParam)
      ? (statusParam as Status)
      : "UNUSED";
    const page = Math.max(
      1,
      Number.parseInt(url.searchParams.get("page") ?? "1", 10) || 1
    );

    const where = { status };
    const [total, codes] = await Promise.all([
      prisma.activationCode.count({ where }),
      prisma.activationCode.findMany({
        where,
        include: {
          plan: { select: { id: true, name: true } },
          usedBy: { select: { id: true, username: true } },
        },
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
      status,
      codes,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  const requestId = createRequestId();
  const meta = getRequestMeta(request, requestId);

  try {
    const actor = await requireAdmin();
    const body = await request.json();
    const planId = String(body?.planId ?? "").trim();
    const count = Number.parseInt(String(body?.count ?? "0"), 10);
    const note = body?.note ? String(body.note) : null;

    if (!planId) {
      return NextResponse.json(
        { success: false, error: "请选择套餐" },
        { status: 400 }
      );
    }
    if (!Number.isInteger(count) || count <= 0 || count > 1000) {
      return NextResponse.json(
        { success: false, error: "数量需为 1-1000" },
        { status: 400 }
      );
    }

    const plan = await prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) {
      return NextResponse.json(
        { success: false, error: "套餐不存在" },
        { status: 404 }
      );
    }
    if (!plan.active) {
      return NextResponse.json(
        { success: false, error: "套餐已禁用" },
        { status: 400 }
      );
    }

    const created: string[] = [];
    for (let i = 0; i < count; i++) {
      const code = formatActivationCode(plan.id);
      await prisma.activationCode.create({
        data: { code, planId: plan.id, note: note?.trim() || null },
      });
      created.push(code);
    }

    logger.info("admin generated codes", {
      ...meta,
      actorId: actor.id,
      planId,
      count,
      note,
    });

    return NextResponse.json({ success: true, codes: created });
  } catch (error) {
    return errorResponse(error, meta);
  }
}
