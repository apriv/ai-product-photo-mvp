import { NextResponse } from "next/server";
import sharp from "sharp";
import { AuthError, requireUser } from "@/lib/auth";
import { errorResponse } from "@/lib/api-errors";
import logger from "@/lib/logger";
import {
  defaultPosterText,
  getPosterFontSize,
  getPosterTextTemplate,
  getTextMeasure,
  type PosterTextBox,
  type PosterTextField,
  type PosterTextValues,
} from "@/features/poster/text-templates";

const MAX_REMOTE_IMAGE_BYTES = 12 * 1024 * 1024;
const OUTPUT_SIZE = 1024;
const MAX_TEXT_LENGTH = 120;

type RenderRequest = {
  imageUrl?: unknown;
  templateId?: unknown;
  title?: unknown;
  subtitle?: unknown;
  cta?: unknown;
};

function sanitizeText(value: unknown, fallback: string) {
  if (typeof value !== "string") return fallback;
  const compact = value.replace(/\s+/g, " ").trim();
  return compact.slice(0, MAX_TEXT_LENGTH) || fallback;
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function parseDataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:image\/(?:png|jpeg|jpg|webp);base64,(.+)$/);
  if (!match) throw new Error("不支持的图片格式");
  return Buffer.from(match[1], "base64");
}

async function loadImageBuffer(imageUrl: string) {
  if (imageUrl.startsWith("data:image/")) {
    const buffer = parseDataUrl(imageUrl);
    if (buffer.byteLength > MAX_REMOTE_IMAGE_BYTES) {
      throw new Error("图片过大，请重新生成");
    }
    return buffer;
  }

  let url: URL;
  try {
    url = new URL(imageUrl);
  } catch {
    throw new Error("图片地址无效");
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("图片地址无效");
  }

  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error("读取底图失败，请重新生成");
  }

  const contentLength = response.headers.get("content-length");
  if (contentLength && Number(contentLength) > MAX_REMOTE_IMAGE_BYTES) {
    throw new Error("图片过大，请重新生成");
  }

  const arrayBuffer = await response.arrayBuffer();
  if (arrayBuffer.byteLength > MAX_REMOTE_IMAGE_BYTES) {
    throw new Error("图片过大，请重新生成");
  }
  return Buffer.from(arrayBuffer);
}

function getBoxLeft(box: PosterTextBox, canvasWidth: number) {
  if (box.align === "center") return ((box.x - box.width / 2) / 100) * canvasWidth;
  if (box.align === "right") return ((box.x - box.width) / 100) * canvasWidth;
  return (box.x / 100) * canvasWidth;
}

function getTextAnchor(box: PosterTextBox) {
  if (box.align === "center") return "middle";
  if (box.align === "right") return "end";
  return "start";
}

function getAnchorX(box: PosterTextBox, canvasWidth: number) {
  return (box.x / 100) * canvasWidth;
}

function wrapText(text: string, maxUnits: number, maxLines: number) {
  const source = text.trim();
  if (!source) return [""];

  const words = source.includes(" ") ? source.split(" ") : Array.from(source);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const separator = source.includes(" ") && current ? " " : "";
    const next = `${current}${separator}${word}`;
    if (getTextMeasure(next) <= maxUnits || !current) {
      current = next;
      continue;
    }

    lines.push(current);
    current = word;
    if (lines.length >= maxLines) break;
  }

  if (lines.length < maxLines && current) lines.push(current);
  if (lines.length > maxLines) lines.length = maxLines;

  if (lines.length === maxLines) {
    const last = lines[maxLines - 1];
    if (getTextMeasure(last) > maxUnits) {
      let shortened = last;
      while (shortened.length > 1 && getTextMeasure(`${shortened}...`) > maxUnits) {
        shortened = shortened.slice(0, -1);
      }
      lines[maxLines - 1] = `${shortened}...`;
    }
  }

  return lines;
}

function renderTextField(
  field: PosterTextField,
  value: string,
  box: PosterTextBox,
  canvasWidth: number,
  canvasHeight: number
) {
  const text = box.uppercase ? value.toUpperCase() : value;
  const fontSize = getPosterFontSize(text, box);
  const maxWidthPx = (box.width / 100) * canvasWidth;
  const maxUnits = Math.max(3, maxWidthPx / (fontSize * 0.56));
  const lines = wrapText(text, maxUnits, box.maxLines);
  const lineHeightPx = fontSize * box.lineHeight;
  const top = (box.y / 100) * canvasHeight;
  const anchorX = getAnchorX(box, canvasWidth);
  const anchor = getTextAnchor(box);
  const escapedFont = escapeXml(box.fontFamily);
  const letterSpacing = box.letterSpacing ?? 0;
  const textElements = lines
    .map((line, index) => {
      const y = top + fontSize + index * lineHeightPx;
      const escapedLine = escapeXml(line);
      const baseAttrs = `x="${anchorX.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="${anchor}" font-family="${escapedFont}" font-size="${fontSize}" font-weight="${box.fontWeight}" letter-spacing="${letterSpacing}"`;
      const shadow = box.shadow
        ? `<text ${baseAttrs} fill="rgba(0,0,0,0.42)" transform="translate(2 3)">${escapedLine}</text>`
        : "";
      return `${shadow}<text ${baseAttrs} fill="${escapeXml(box.color)}">${escapedLine}</text>`;
    })
    .join("");

  if (!box.background || field !== "cta") return textElements;

  const textWidth =
    Math.min(maxWidthPx, Math.max(...lines.map(getTextMeasure)) * fontSize * 0.62) +
    box.background.paddingX * 2;
  const rectWidth = Math.min(maxWidthPx, textWidth);
  const rectHeight = fontSize * box.lineHeight + box.background.paddingY * 2;
  const left =
    box.align === "center"
      ? anchorX - rectWidth / 2
      : box.align === "right"
        ? anchorX - rectWidth
        : getBoxLeft(box, canvasWidth);
  const rect = `<rect x="${left.toFixed(1)}" y="${top.toFixed(1)}" width="${rectWidth.toFixed(1)}" height="${rectHeight.toFixed(1)}" rx="${box.background.radius}" fill="${escapeXml(box.background.color)}" />`;
  const ctaY = top + box.background.paddingY + fontSize * 0.82;
  const ctaText = `<text x="${(left + rectWidth / 2).toFixed(1)}" y="${ctaY.toFixed(1)}" text-anchor="middle" font-family="${escapedFont}" font-size="${fontSize}" font-weight="${box.fontWeight}" fill="${escapeXml(box.color)}">${escapeXml(lines[0] ?? "")}</text>`;
  return `${rect}${ctaText}`;
}

function renderOverlaySvg(
  templateId: string,
  values: PosterTextValues,
  canvasWidth = OUTPUT_SIZE,
  canvasHeight = OUTPUT_SIZE
) {
  const template = getPosterTextTemplate(templateId);
  if (!template) throw new Error("未知海报文字模板");

  const defs = template.overlay
    ? `<defs><linearGradient id="bottomFade" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${template.overlay.from}" /><stop offset="100%" stop-color="${template.overlay.to}" /></linearGradient></defs>`
    : "";
  const overlay = template.overlay
    ? `<rect x="0" y="${canvasHeight * 0.55}" width="${canvasWidth}" height="${canvasHeight * 0.45}" fill="url(#bottomFade)" />`
    : "";
  const fields = (["title", "subtitle", "cta"] as PosterTextField[])
    .map((field) =>
      renderTextField(field, values[field], template.fields[field], canvasWidth, canvasHeight)
    )
    .join("");

  return `<svg width="${canvasWidth}" height="${canvasHeight}" viewBox="0 0 ${canvasWidth} ${canvasHeight}" xmlns="http://www.w3.org/2000/svg">${defs}${overlay}${fields}</svg>`;
}

export async function POST(request: Request) {
  let userId = "";
  try {
    const user = await requireUser();
    userId = user.id;
    const body = (await request.json()) as RenderRequest;
    const imageUrl = typeof body.imageUrl === "string" ? body.imageUrl : "";
    const templateId =
      typeof body.templateId === "string" ? body.templateId : "minimal";

    if (!imageUrl) {
      return NextResponse.json(
        { success: false, error: "缺少底图" },
        { status: 400 }
      );
    }

    const template = getPosterTextTemplate(templateId);
    if (!template) {
      return NextResponse.json(
        { success: false, error: "未知海报文字模板" },
        { status: 400 }
      );
    }

    const values: PosterTextValues = {
      title: sanitizeText(body.title, defaultPosterText.title),
      subtitle: sanitizeText(body.subtitle, defaultPosterText.subtitle),
      cta: sanitizeText(body.cta, defaultPosterText.cta),
    };

    const baseImage = await loadImageBuffer(imageUrl);
    const overlaySvg = renderOverlaySvg(template.id, values);
    const finalImage = await sharp(baseImage)
      .resize(OUTPUT_SIZE, OUTPUT_SIZE, { fit: "cover" })
      .composite([{ input: Buffer.from(overlaySvg), top: 0, left: 0 }])
      .png()
      .toBuffer();

    logger.info("Poster rendered", { userId, template: template.id });
    return NextResponse.json({
      success: true,
      imageUrl: `data:image/png;base64,${finalImage.toString("base64")}`,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return errorResponse(error, { userId });
    }
    return errorResponse(error, { userId, feature: "poster-render" });
  }
}

