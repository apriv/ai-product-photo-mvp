import { posterFontFamilies } from "@/features/poster/fonts";

export type PosterTemplateId =
  | "editorial"
  | "studio-pop"
  | "street-note"
  | "soft-social";
export type PosterTextField = "title" | "subtitle" | "cta";
export type TextAlign = "left" | "center" | "right";

export type PosterTextValues = Record<PosterTextField, string>;

export type PosterTextBox = {
  x: number;
  y: number;
  width: number;
  align: TextAlign;
  color: string;
  fontFamily: string;
  fontWeight: number;
  maxFontSize: number;
  minFontSize: number;
  lineHeight: number;
  maxLines: number;
  letterSpacing?: number;
  uppercase?: boolean;
  rotate?: number;
  shadow?: string;
  background?: {
    color: string;
    paddingX: number;
    paddingY: number;
    radius: number;
  };
};

export type PosterTextTemplate = {
  id: PosterTemplateId;
  name: string;
  desc: string;
  defaultText: PosterTextValues;
  fields: Record<PosterTextField, PosterTextBox>;
  overlay?: {
    kind: "bottom-gradient";
    from: string;
    to: string;
  };
};

export const defaultPosterText: PosterTextValues = {
  title: "Quiet Luxury",
  subtitle: "A refined everyday essential",
  cta: "Discover",
};

const BODY = posterFontFamilies.body;
const EDITORIAL = posterFontFamilies.editorial;
const STUDIO = posterFontFamilies.studio;
const STREET = posterFontFamilies.street;
const SOFT = posterFontFamilies.soft;

export const posterTextTemplates: PosterTextTemplate[] = [
  {
    id: "editorial",
    name: "Editorial",
    desc: "高级杂志感，适合美妆、香水、饰品",
    defaultText: {
      title: "Quiet Luxury",
      subtitle: "A refined everyday essential",
      cta: "Discover",
    },
    fields: {
      title: {
        x: 50,
        y: 8,
        width: 82,
        align: "center",
        color: "#fff7ed",
        fontFamily: EDITORIAL,
        fontWeight: 900,
        maxFontSize: 78,
        minFontSize: 36,
        lineHeight: 0.96,
        maxLines: 2,
        shadow: "0 4px 22px rgba(0,0,0,0.42)",
      },
      subtitle: {
        x: 50,
        y: 20,
        width: 74,
        align: "center",
        color: "#fff1dc",
        fontFamily: BODY,
        fontWeight: 600,
        maxFontSize: 24,
        minFontSize: 15,
        lineHeight: 1.22,
        maxLines: 2,
        letterSpacing: 0.6,
        shadow: "0 2px 12px rgba(0,0,0,0.38)",
      },
      cta: {
        x: 50,
        y: 83,
        width: 38,
        align: "center",
        color: "#fff7ed",
        fontFamily: BODY,
        fontWeight: 800,
        maxFontSize: 21,
        minFontSize: 16,
        lineHeight: 1,
        maxLines: 1,
        background: {
          color: "rgba(17,24,39,0.88)",
          paddingX: 26,
          paddingY: 14,
          radius: 999,
        },
      },
    },
  },
  {
    id: "studio-pop",
    name: "Studio Pop",
    desc: "年轻品牌感，适合服饰、宠物用品、潮玩",
    defaultText: {
      title: "Fresh Drop",
      subtitle: "Made for your daily rotation",
      cta: "Shop the edit",
    },
    fields: {
      title: {
        x: 8,
        y: 60,
        width: 66,
        align: "left",
        color: "#ffffff",
        fontFamily: STUDIO,
        fontWeight: 400,
        maxFontSize: 82,
        minFontSize: 36,
        lineHeight: 0.92,
        maxLines: 2,
        uppercase: true,
        letterSpacing: 0.4,
        shadow: "0 4px 18px rgba(0,0,0,0.42)",
      },
      subtitle: {
        x: 8,
        y: 73,
        width: 62,
        align: "left",
        color: "#f8fafc",
        fontFamily: BODY,
        fontWeight: 650,
        maxFontSize: 24,
        minFontSize: 16,
        lineHeight: 1.18,
        maxLines: 2,
        shadow: "0 2px 12px rgba(0,0,0,0.38)",
      },
      cta: {
        x: 8,
        y: 84,
        width: 44,
        align: "left",
        color: "#ffffff",
        fontFamily: BODY,
        fontWeight: 850,
        maxFontSize: 20,
        minFontSize: 15,
        lineHeight: 1,
        maxLines: 1,
        background: {
          color: "#f05f57",
          paddingX: 22,
          paddingY: 13,
          radius: 10,
        },
      },
    },
  },
  {
    id: "street-note",
    name: "Street Note",
    desc: "涂鸦贴纸感，适合潮牌、运动、促销",
    defaultText: {
      title: "Just Landed",
      subtitle: "Limited vibe, everyday use",
      cta: "Grab it",
    },
    fields: {
      title: {
        x: 90,
        y: 10,
        width: 62,
        align: "right",
        color: "#ffffff",
        fontFamily: STREET,
        fontWeight: 400,
        maxFontSize: 68,
        minFontSize: 32,
        lineHeight: 0.94,
        maxLines: 2,
        rotate: -3,
        shadow: "3px 3px 0 rgba(225,29,72,0.95), 0 4px 16px rgba(0,0,0,0.4)",
      },
      subtitle: {
        x: 90,
        y: 24,
        width: 58,
        align: "right",
        color: "#f8fafc",
        fontFamily: BODY,
        fontWeight: 750,
        maxFontSize: 22,
        minFontSize: 15,
        lineHeight: 1.18,
        maxLines: 2,
        shadow: "0 2px 10px rgba(0,0,0,0.35)",
      },
      cta: {
        x: 90,
        y: 84,
        width: 40,
        align: "right",
        color: "#111827",
        fontFamily: STUDIO,
        fontWeight: 900,
        maxFontSize: 24,
        minFontSize: 14,
        lineHeight: 1,
        maxLines: 1,
        uppercase: true,
        background: {
          color: "#f8fafc",
          paddingX: 24,
          paddingY: 13,
          radius: 999,
        },
      },
    },
  },
  {
    id: "soft-social",
    name: "Soft Social",
    desc: "温柔生活方式感，适合宠物、家居、食品",
    defaultText: {
      title: "Little Joys",
      subtitle: "Soft details for everyday moments",
      cta: "Take a look",
    },
    overlay: {
      kind: "bottom-gradient",
      from: "rgba(0,0,0,0)",
      to: "rgba(44,34,30,0.62)",
    },
    fields: {
      title: {
        x: 50,
        y: 67,
        width: 82,
        align: "center",
        color: "#fff7ed",
        fontFamily: SOFT,
        fontWeight: 700,
        maxFontSize: 78,
        minFontSize: 34,
        lineHeight: 0.95,
        maxLines: 2,
        shadow: "0 3px 14px rgba(0,0,0,0.38)",
      },
      subtitle: {
        x: 50,
        y: 78,
        width: 76,
        align: "center",
        color: "#fef3e2",
        fontFamily: BODY,
        fontWeight: 600,
        maxFontSize: 24,
        minFontSize: 16,
        lineHeight: 1.18,
        maxLines: 2,
        shadow: "0 2px 10px rgba(0,0,0,0.45)",
      },
      cta: {
        x: 50,
        y: 88,
        width: 44,
        align: "center",
        color: "#2f3a31",
        fontFamily: BODY,
        fontWeight: 800,
        maxFontSize: 21,
        minFontSize: 15,
        lineHeight: 1,
        maxLines: 1,
        background: {
          color: "#f7ead7",
          paddingX: 26,
          paddingY: 13,
          radius: 999,
        },
      },
    },
  },
];

export function getPosterTextTemplate(id: string) {
  return posterTextTemplates.find((template) => template.id === id);
}

export function getDefaultPosterText(id: string): PosterTextValues {
  return getPosterTextTemplate(id)?.defaultText ?? defaultPosterText;
}

function textWeight(char: string) {
  return /[\u3000-\u9fff\uff00-\uffef]/.test(char) ? 1 : 0.58;
}

export function getTextMeasure(text: string) {
  return Array.from(text.trim()).reduce((sum, char) => {
    if (/\s/.test(char)) return sum + 0.32;
    return sum + textWeight(char);
  }, 0);
}

export function getPosterFontSize(text: string, box: PosterTextBox) {
  const content = text.trim() || " ";
  const weightedLength = Math.max(1, getTextMeasure(content));
  const linesPressure = Math.ceil(weightedLength / box.maxLines);
  const fitRatio = Math.min(1, box.width / Math.max(1, linesPressure * 2.6));
  const size =
    box.minFontSize + (box.maxFontSize - box.minFontSize) * fitRatio;
  return Math.round(
    Math.max(box.minFontSize, Math.min(box.maxFontSize, size))
  );
}

export function isPosterTextTooLong(text: string, box: PosterTextBox) {
  const fontSize = getPosterFontSize(text, box);
  return fontSize <= box.minFontSize && getTextMeasure(text) > box.width * 0.9;
}
