import { NextResponse } from "next/server";
import { AuthError, requireUser } from "@/lib/auth";
import logger from "@/lib/logger";
import { createRequestId, getRequestMeta } from "@/lib/request-meta";
import {
  buildSeedingVideoPrompt,
  COPY_GPT_MODEL,
} from "@/features/copy/gpt-config";

type OpenAITextContent = {
  type?: string;
  text?: string;
};

type OpenAIOutputItem = {
  content?: OpenAITextContent[];
};

type OpenAIResponse = {
  output_text?: string;
  output?: OpenAIOutputItem[];
  error?: { message?: string };
};

function extractOutputText(data: OpenAIResponse) {
  if (data.output_text) return data.output_text.trim();

  return (
    data.output
      ?.flatMap((item) => item.content ?? [])
      .map((item) => item.text ?? "")
      .join("\n")
      .trim() ?? ""
  );
}

export async function POST(request: Request) {
  const requestId = createRequestId();
  const requestMeta = getRequestMeta(request, requestId);

  try {
    const user = await requireUser();
    const apiKey = process.env.GPT_KEY?.trim();

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "GPT_KEY 未配置" },
        { status: 500 }
      );
    }

    const body = (await request.json()) as {
      productTitle?: string;
      productDescription?: string;
    };
    const prompt = buildSeedingVideoPrompt({
      productTitle: body.productTitle,
      productDescription: body.productDescription,
    });

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: COPY_GPT_MODEL,
        input: prompt,
      }),
    });

    const data = (await response.json()) as OpenAIResponse;
    if (!response.ok) {
      logger.warn("OpenAI copy generation failed", {
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

    return NextResponse.json({ success: true, text, model: COPY_GPT_MODEL });
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
