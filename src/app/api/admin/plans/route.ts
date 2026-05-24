import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { errorResponse } from "@/lib/api-errors";

export async function GET() {
  try {
    await requireAdmin();
    const plans = await prisma.plan.findMany({
      orderBy: { id: "asc" },
    });
    return NextResponse.json({ success: true, plans });
  } catch (error) {
    return errorResponse(error);
  }
}
