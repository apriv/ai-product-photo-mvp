import { imageModels, imagePrompts } from "@/features/image/model-config";

export type ImageTemplate = {
  name: string;
  desc: string;
  enabled: boolean;
  kind: "fal-poster" | "fal-birefnet" | "placeholder";
  cost: number; // credits charged per successful generation
  model?: string;
  prompt?: string;
};

export const imageTemplates: ImageTemplate[] = [
  {
    name: "社媒海报",
    desc: "生成带背景、灯光、海报感的高端商品图，适合小红书/Instagram",
    enabled: true,
    kind: "fal-poster",
    cost: 10,
    model: imageModels.poster,
    prompt: imagePrompts.poster,
  },
  {
    name: "白底商品展示图",
    desc: "生成白底主图 + 多角度细节排版，适合电商平台",
    enabled: true,
    kind: "fal-poster",
    cost: 10,
    model: imageModels.poster,
    prompt: imagePrompts.listingBoard,
  },
  {
    name: "仅抠图",
    desc: "只进行抠图处理，适合后续自己设计背景",
    enabled: true,
    kind: "fal-birefnet",
    cost: 5,
    model: imageModels.backgroundRemoval,
  },
  {
    name: "占位预览",
    desc: "生成测试用 Placeholder 不消耗 Token",
    enabled: true,
    kind: "placeholder",
    cost: 0,
  },
];

export function getImageTemplate(name: string): ImageTemplate | undefined {
  return imageTemplates.find((item) => item.name === name);
}
