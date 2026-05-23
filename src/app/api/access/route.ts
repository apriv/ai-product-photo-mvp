import { NextResponse } from "next/server";
import { validateAccessPassword } from "@/lib/access-control";
import { ACCESS_PASSWORD_FIELD } from "@/lib/access-shared";
import logger from "@/lib/logger";
import { createRequestId, getRequestMeta } from "@/lib/request-meta";

// 版本号：使用构建时间戳
const BUILD_VERSION = process.env.BUILD_VERSION || new Date().toISOString();

export async function POST(request: Request) {
  const requestId = createRequestId();
  const requestMeta = getRequestMeta(request, requestId);

  try {
    const body = await request.json();
    const password =
      body && typeof body === "object" && ACCESS_PASSWORD_FIELD in body
        ? body[ACCESS_PASSWORD_FIELD]
        : undefined;

    const access = validateAccessPassword(password);

    if (!access.ok) {
      logger.warn("Access password rejected", {
        ...requestMeta,
        status: access.status,
      });
      return NextResponse.json(
        {
          success: false,
          error: access.error,
          version: BUILD_VERSION,
        },
        { status: access.status }
      );
    }

    logger.info("Access password accepted", requestMeta);
    return NextResponse.json({
      success: true,
      version: BUILD_VERSION,
    });
  } catch (error) {
    logger.error("Access check failed", {
      ...requestMeta,
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      {
        success: false,
        error: "访问校验失败",
        version: BUILD_VERSION,
      },
      { status: 500 }
    );
  }
}
