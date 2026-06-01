import { NextResponse } from "next/server";
import { AuthError, requireUser } from "@/lib/auth";
import logger from "@/lib/logger";
import { createRequestId, getRequestMeta } from "@/lib/request-meta";
import {
  buildSeedingVideoPrompt,
  COPY_GEMINI_MODEL,
} from "@/features/copy/gemini-config";

type GeminiPart = {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string;
  };
};

type GeminiCandidate = {
  content?: {
    parts?: GeminiPart[];
  };
};

type GeminiResponse = {
  candidates?: GeminiCandidate[];
  error?: { message?: string };
};

function extractOutputText(data: GeminiResponse) {
  return (
    data.candidates
      ?.flatMap((candidate) => candidate.content?.parts ?? [])
      .map((item) => item.text ?? "")
      .join("\n")
      .trim() ?? ""
  );
}

function parseImageDataUrl(dataUrl: string | undefined) {
  const match = dataUrl?.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) {
    return null;
  }

  return {
    mimeType: match[1],
    data: match[2],
  };
}

export async function POST(request: Request) {
  const requestId = createRequestId();
  const requestMeta = getRequestMeta(request, requestId);

  try {
    const user = await requireUser();
    const apiKey = process.env.GEMINI_KEY?.trim();

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "GEMINI_KEY 未配置" },
        { status: 500 }
      );
    }

    const body = (await request.json()) as {
      productTitle?: string;
      productDescription?: string;
      productImageDataUrl?: string;
    };
    const imageInput = parseImageDataUrl(body.productImageDataUrl);
    const prompt = buildSeedingVideoPrompt({
      productTitle: body.productTitle,
      productDescription: body.productDescription,
      hasProductImage: Boolean(imageInput),
    });
    const parts: GeminiPart[] = [{ text: prompt }];

    if (imageInput) {
      parts.push({ inlineData: imageInput });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${COPY_GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{ role: "user", parts }],
        }),
      }
    );

    const data = (await response.json()) as GeminiResponse;
    if (!response.ok) {
      logger.warn("Gemini copy generation failed", {
        ...requestMeta,
        userId: user.id,
        status: response.status,
        error: data.error?.message,
      });
      return NextResponse.json(
        { success: false, error: data.error?.message || "文案生成失败" },
        { status: response.status }
      );
    }

    const text = extractOutputText(data);
    if (!text) {
      return NextResponse.json(
        { success: false, error: "文案生成结果为空" },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true, text, model: COPY_GEMINI_MODEL });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: "请先登录" },
        { status: 401 }
      );
    }

    logger.error("Copy generation route failed", {
      ...requestMeta,
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { success: false, error: "文案生成失败，请稍后重试" },
      { status: 500 }
    );
  }
}
