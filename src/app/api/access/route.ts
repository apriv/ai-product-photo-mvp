import { NextResponse } from "next/server";
import { validateAccessPassword } from "@/lib/access-control";
import { ACCESS_PASSWORD_FIELD } from "@/lib/access-shared";
import logger from "@/lib/logger";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const password =
      body && typeof body === "object" && ACCESS_PASSWORD_FIELD in body
        ? body[ACCESS_PASSWORD_FIELD]
        : undefined;

    const access = validateAccessPassword(password);

    if (!access.ok) {
      logger.warn("Access password rejected", { status: access.status });
      return NextResponse.json(
        {
          success: false,
          error: access.error,
        },
        { status: access.status }
      );
    }

    logger.info("Access password accepted");
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Access check failed", {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      {
        success: false,
        error: "访问校验失败",
      },
      { status: 500 }
    );
  }
}
