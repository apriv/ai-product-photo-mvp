export type PosterTemplateId = "minimal" | "luxury" | "tech" | "social";
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
  fields: Record<PosterTextField, PosterTextBox>;
  overlay?: {
    kind: "bottom-gradient";
    from: string;
    to: string;
  };
};

export const defaultPosterText: PosterTextValues = {
  title: "New Arrival",
  subtitle: "Premium product photography",
  cta: "Shop Now",
};

const SANS = "Arial, Helvetica, sans-serif";
const SERIF = "Georgia, Times New Roman, serif";
const HEAVY = "Arial Black, Arial, Helvetica, sans-serif";

export const posterTextTemplates: PosterTextTemplate[] = [
  {
    id: "minimal",
    name: "简洁",
    desc: "留白多，信息克制，适合多数日常商品",
    fields: {
      title: {
        x: 50,
        y: 9,
        width: 78,
        align: "center",
        color: "#111827",
        fontFamily: SANS,
        fontWeight: 800,
        maxFontSize: 72,
        minFontSize: 34,
        lineHeight: 1.03,
        maxLines: 2,
      },
      subtitle: {
        x: 50,
        y: 18,
        width: 70,
        align: "center",
        color: "#374151",
        fontFamily: SANS,
        fontWeight: 500,
        maxFontSize: 28,
        minFontSize: 18,
        lineHeight: 1.2,
        maxLines: 2,
      },
      cta: {
        x: 50,
        y: 83,
        width: 36,
        align: "center",
        color: "#ffffff",
        fontFamily: SANS,
        fontWeight: 700,
        maxFontSize: 24,
        minFontSize: 16,
        lineHeight: 1,
        maxLines: 1,
        background: {
          color: "#111827",
          paddingX: 26,
          paddingY: 14,
          radius: 999,
        },
      },
    },
  },
  {
    id: "luxury",
    name: "奢华",
    desc: "杂志感、精致，适合美妆、饰品和高客单价商品",
    fields: {
      title: {
        x: 8,
        y: 64,
        width: 62,
        align: "left",
        color: "#fbf7ef",
        fontFamily: SERIF,
        fontWeight: 700,
        maxFontSize: 66,
        minFontSize: 32,
        lineHeight: 1.02,
        maxLines: 2,
        shadow: "0 3px 14px rgba(0,0,0,0.35)",
      },
      subtitle: {
        x: 8,
        y: 74,
        width: 58,
        align: "left",
        color: "#f6ead4",
        fontFamily: SANS,
        fontWeight: 500,
        maxFontSize: 25,
        minFontSize: 16,
        lineHeight: 1.18,
        maxLines: 2,
        shadow: "0 2px 10px rgba(0,0,0,0.35)",
      },
      cta: {
        x: 8,
        y: 84,
        width: 34,
        align: "center",
        color: "#2d2115",
        fontFamily: SANS,
        fontWeight: 800,
        maxFontSize: 22,
        minFontSize: 15,
        lineHeight: 1,
        maxLines: 1,
        background: {
          color: "#f6d487",
          paddingX: 24,
          paddingY: 13,
          radius: 999,
        },
      },
    },
  },
  {
    id: "tech",
    name: "科技感",
    desc: "干净利落，适合数码、小家电和工具类商品",
    fields: {
      title: {
        x: 92,
        y: 11,
        width: 58,
        align: "right",
        color: "#e6fbff",
        fontFamily: HEAVY,
        fontWeight: 900,
        maxFontSize: 60,
        minFontSize: 30,
        lineHeight: 1,
        maxLines: 2,
        uppercase: true,
        shadow: "0 2px 12px rgba(0,0,0,0.45)",
      },
      subtitle: {
        x: 92,
        y: 22,
        width: 52,
        align: "right",
        color: "#b9f2ff",
        fontFamily: SANS,
        fontWeight: 600,
        maxFontSize: 24,
        minFontSize: 15,
        lineHeight: 1.18,
        maxLines: 2,
        shadow: "0 2px 10px rgba(0,0,0,0.35)",
      },
      cta: {
        x: 92,
        y: 32,
        width: 34,
        align: "center",
        color: "#021014",
        fontFamily: SANS,
        fontWeight: 900,
        maxFontSize: 21,
        minFontSize: 14,
        lineHeight: 1,
        maxLines: 1,
        uppercase: true,
        background: {
          color: "#67e8f9",
          paddingX: 22,
          paddingY: 12,
          radius: 6,
        },
      },
    },
  },
  {
    id: "social",
    name: "网感",
    desc: "社媒促销感强，文字醒目，适合小红书/Instagram/TikTok",
    overlay: {
      kind: "bottom-gradient",
      from: "rgba(0,0,0,0)",
      to: "rgba(0,0,0,0.68)",
    },
    fields: {
      title: {
        x: 50,
        y: 68,
        width: 82,
        align: "center",
        color: "#ffffff",
        fontFamily: HEAVY,
        fontWeight: 900,
        maxFontSize: 70,
        minFontSize: 32,
        lineHeight: 1,
        maxLines: 2,
        shadow: "0 3px 16px rgba(0,0,0,0.5)",
      },
      subtitle: {
        x: 50,
        y: 78,
        width: 76,
        align: "center",
        color: "#f3f4f6",
        fontFamily: SANS,
        fontWeight: 600,
        maxFontSize: 26,
        minFontSize: 16,
        lineHeight: 1.18,
        maxLines: 2,
        shadow: "0 2px 10px rgba(0,0,0,0.45)",
      },
      cta: {
        x: 50,
        y: 88,
        width: 42,
        align: "center",
        color: "#111827",
        fontFamily: SANS,
        fontWeight: 900,
        maxFontSize: 24,
        minFontSize: 15,
        lineHeight: 1,
        maxLines: 1,
        background: {
          color: "#ffffff",
          paddingX: 28,
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

