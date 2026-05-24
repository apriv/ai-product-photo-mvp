"use client";

import { posterFontFamilies } from "@/features/poster/fonts";
import {
  getPosterFontSize,
  type PosterTextBox,
  type PosterTextField,
  type PosterTextTemplate,
  type PosterTextValues,
} from "@/features/poster/text-templates";

// We render onto a fixed-size canvas, then export as PNG. All "%" fields in
// PosterTextBox are interpreted against this width/height. Font sizes from
// getPosterFontSize() are already px-at-1024-wide, so they map 1:1 here.
const CANVAS_SIZE = 1024;

// Mirrors the padding the editor uses for the CTA input
// (Tailwind classes `px-[1.35em] py-[0.65em]`).
const CTA_PADDING_X_EM = 1.35;
const CTA_PADDING_Y_EM = 0.65;
const CTA_MIN_WIDTH_EM = 7.5;

type FieldOrder = readonly PosterTextField[];
const FIELDS: FieldOrder = ["title", "subtitle", "cta"];

async function ensureFontsReady() {
  // Force the browser to actually fetch and decode each next/font face we
  // might draw, instead of waiting for the first canvas paint to trigger a
  // race. The strings are full font-family stacks; only families known to
  // the page are loaded, others are ignored silently by load().
  const probes = Object.values(posterFontFamilies).map((stack) =>
    Promise.allSettled([
      document.fonts.load(`400 24px ${stack}`),
      document.fonts.load(`700 24px ${stack}`),
      document.fonts.load(`800 24px ${stack}`),
      document.fonts.load(`900 24px ${stack}`),
    ])
  );
  await Promise.allSettled(probes);
  await document.fonts.ready;
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("海报底图加载失败"));
    img.src = src;
  });
}

function pctToPx(pct: number) {
  return (pct / 100) * CANVAS_SIZE;
}

function setCtxFont(ctx: CanvasRenderingContext2D, box: PosterTextBox, fontSize: number) {
  ctx.font = `${box.fontWeight} ${fontSize}px ${box.fontFamily}`;
  ctx.fillStyle = box.color;
  ctx.textBaseline = "top";
  ctx.textAlign = box.align;
}

function transformText(box: PosterTextBox, raw: string) {
  return box.uppercase ? raw.toUpperCase() : raw;
}

// Soft wrap inside the box width, preserving explicit \n. Falls back to char
// breaking when no whitespace is available (CJK).
function wrapLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidthPx: number,
  maxLines: number
): string[] {
  const out: string[] = [];
  const paragraphs = text.split(/\n/);

  for (const paragraph of paragraphs) {
    if (out.length >= maxLines) break;
    if (!paragraph) {
      out.push("");
      continue;
    }

    let line = "";
    for (const ch of Array.from(paragraph)) {
      const candidate = line + ch;
      const width = ctx.measureText(candidate).width;
      if (width <= maxWidthPx || line === "") {
        line = candidate;
      } else {
        out.push(line);
        if (out.length >= maxLines) {
          line = "";
          break;
        }
        line = ch;
      }
    }
    if (line && out.length < maxLines) out.push(line);
  }

  return out.slice(0, Math.max(1, maxLines));
}

function applyShadow(ctx: CanvasRenderingContext2D, shadow: string | undefined) {
  if (!shadow) {
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.shadowColor = "transparent";
    return;
  }
  // Parse a simple CSS text-shadow: "Xpx Ypx Bpx color" — color may contain
  // spaces (rgba). Anything we don't recognise just gets ignored.
  const match = shadow.match(/^(-?\d+(?:\.\d+)?)px\s+(-?\d+(?:\.\d+)?)px\s+(\d+(?:\.\d+)?)px\s+(.+)$/);
  if (!match) {
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.shadowColor = "transparent";
    return;
  }
  ctx.shadowOffsetX = Number(match[1]);
  ctx.shadowOffsetY = Number(match[2]);
  ctx.shadowBlur = Number(match[3]);
  ctx.shadowColor = match[4].trim();
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number
) {
  const r = Math.min(radius, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function originX(box: PosterTextBox) {
  // Editor positions the box left edge at:
  //   align=left: x
  //   align=center: x - width/2
  //   align=right: x - width
  if (box.align === "left") return pctToPx(box.x);
  if (box.align === "right") return pctToPx(box.x - box.width);
  return pctToPx(box.x - box.width / 2);
}

function drawTextField(
  ctx: CanvasRenderingContext2D,
  box: PosterTextBox,
  raw: string
) {
  const text = transformText(box, raw);
  if (!text.trim() && box.background === undefined) return;

  const fontSize = getPosterFontSize(text, box);
  setCtxFont(ctx, box, fontSize);

  const widthPx = pctToPx(box.width);
  const boxLeft = originX(box);
  const boxTop = pctToPx(box.y);

  if (box.rotate) {
    ctx.save();
    const pivotX =
      box.align === "left"
        ? boxLeft
        : box.align === "right"
          ? boxLeft + widthPx
          : boxLeft + widthPx / 2;
    const pivotY = boxTop + (fontSize * box.lineHeight) / 2;
    ctx.translate(pivotX, pivotY);
    ctx.rotate((box.rotate * Math.PI) / 180);
    ctx.translate(-pivotX, -pivotY);
  }

  const lines = wrapLines(ctx, text, widthPx, box.maxLines);
  const lineHeightPx = fontSize * box.lineHeight;
  const anchorX =
    box.align === "left"
      ? boxLeft
      : box.align === "right"
        ? boxLeft + widthPx
        : boxLeft + widthPx / 2;

  applyShadow(ctx, box.shadow);
  lines.forEach((line, index) => {
    ctx.fillText(line, anchorX, boxTop + index * lineHeightPx);
  });
  applyShadow(ctx, undefined);

  if (box.rotate) ctx.restore();
}

function drawCtaField(
  ctx: CanvasRenderingContext2D,
  box: PosterTextBox,
  raw: string
) {
  const text = transformText(box, raw);
  if (!text.trim()) return;

  const fontSize = getPosterFontSize(text, box);
  setCtxFont(ctx, box, fontSize);

  const padX = fontSize * CTA_PADDING_X_EM;
  const padY = fontSize * CTA_PADDING_Y_EM;
  const minWidth = fontSize * CTA_MIN_WIDTH_EM;
  const textWidth = ctx.measureText(text).width;
  const pillWidth = Math.max(minWidth, textWidth + padX * 2);
  const pillHeight = fontSize * box.lineHeight + padY * 2;

  // Pill is centred horizontally inside the field's box (matches the
  // `<div class="flex" justifyContent>` wrapper in the editor).
  const widthPx = pctToPx(box.width);
  const boxLeft = originX(box);
  const boxTop = pctToPx(box.y);

  const containerX =
    box.align === "left"
      ? boxLeft
      : box.align === "right"
        ? boxLeft + widthPx - pillWidth
        : boxLeft + (widthPx - pillWidth) / 2;
  const containerY = boxTop;

  const radius =
    box.background?.radius && box.background.radius < 999
      ? box.background.radius
      : pillHeight / 2;

  if (box.background?.color) {
    ctx.fillStyle = box.background.color;
    drawRoundedRect(ctx, containerX, containerY, pillWidth, pillHeight, radius);
    ctx.fill();
  }

  // Reset font fill (drawRoundedRect changed it).
  setCtxFont(ctx, box, fontSize);
  const textY = containerY + padY;
  const textX =
    containerX +
    (box.align === "left"
      ? padX
      : box.align === "right"
        ? pillWidth - padX
        : pillWidth / 2);
  // Force center align for the pill content visually
  ctx.textAlign = "center";
  applyShadow(ctx, box.shadow);
  ctx.fillText(text, containerX + pillWidth / 2, textY);
  applyShadow(ctx, undefined);
  // Restore the original align for any later operations
  ctx.textAlign = box.align;
  // textX intentionally unused — kept for future left/right CTA layouts
  void textX;
}

function drawBottomGradient(ctx: CanvasRenderingContext2D) {
  // Matches the editor's `from-transparent to-black/70` over the bottom 45%.
  const startY = CANVAS_SIZE * 0.55;
  const grad = ctx.createLinearGradient(0, startY, 0, CANVAS_SIZE);
  grad.addColorStop(0, "rgba(0,0,0,0)");
  grad.addColorStop(1, "rgba(0,0,0,0.7)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, startY, CANVAS_SIZE, CANVAS_SIZE - startY);
}

function drawBackgroundImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement
) {
  // Mirror CSS `object-fit: cover` for a square canvas.
  const ratio = img.naturalWidth / img.naturalHeight;
  let drawW = CANVAS_SIZE;
  let drawH = CANVAS_SIZE;
  let dx = 0;
  let dy = 0;
  if (ratio > 1) {
    drawW = CANVAS_SIZE * ratio;
    dx = (CANVAS_SIZE - drawW) / 2;
  } else if (ratio < 1) {
    drawH = CANVAS_SIZE / ratio;
    dy = (CANVAS_SIZE - drawH) / 2;
  }
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  ctx.drawImage(img, dx, dy, drawW, drawH);
}

export async function renderPosterToDataUrl(opts: {
  imageUrl: string;
  template: PosterTextTemplate;
  values: PosterTextValues;
}): Promise<string> {
  await ensureFontsReady();
  const img = await loadImage(opts.imageUrl);

  const canvas = document.createElement("canvas");
  canvas.width = CANVAS_SIZE;
  canvas.height = CANVAS_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("无法创建画布");

  drawBackgroundImage(ctx, img);
  if (opts.template.overlay?.kind === "bottom-gradient") {
    drawBottomGradient(ctx);
  }

  for (const field of FIELDS) {
    const box = opts.template.fields[field];
    const raw = opts.values[field] ?? "";
    if (field === "cta") drawCtaField(ctx, box, raw);
    else drawTextField(ctx, box, raw);
  }

  return canvas.toDataURL("image/png");
}
