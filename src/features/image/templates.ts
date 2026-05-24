export const BIREFNET_MODEL = "fal-ai/birefnet";
export const POSTER_MODEL = "xai/grok-imagine-image/edit";

const POSTER_PROMPT = `
Create a premium Instagram-style ecommerce poster background using the uploaded product as the main subject. Keep the product completely realistic and unchanged, preserving the exact shape, colors, logo, material, and details. Use cinematic soft lighting, realistic shadows, elegant composition, and a visually rich luxury background with subtle gradients, reflections, textures, or studio elements instead of plain flat colors. Leave tasteful clean space for advertising text to be added later. Do not generate any text, letters, numbers, fake logos, captions, watermarks, or gibberish. Avoid clutter, distorted objects, oversaturated colors, or cheap AI-generated aesthetics. The final result should look like a real high-end commercial social media advertisement ready for a separate text layer.
`;

const LISTING_BOARD_PROMPT = `
Create a professional ecommerce listing board on a pure white background using the uploaded product. Place the main hero product image large in the center, surrounded by smaller multi-angle views and close-up detail shots showing texture, materials, buttons, packaging, or important features. Keep the product completely consistent and realistic across all images, preserving the exact shape, colors, logo, proportions, and details. Arrange the images in a clean balanced commercial layout with soft shadows, proper spacing, and premium studio lighting. The final result should look like a professionally designed Amazon or Shopify product listing preview board.
`;

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
    model: POSTER_MODEL,
    prompt: POSTER_PROMPT,
  },
  {
    name: "白底商品展示图",
    desc: "生成白底主图 + 多角度细节排版，适合电商平台",
    enabled: true,
    kind: "fal-poster",
    cost: 10,
    model: POSTER_MODEL,
    prompt: LISTING_BOARD_PROMPT,
  },
  {
    name: "仅抠图",
    desc: "只进行抠图处理，适合后续自己设计背景",
    enabled: true,
    kind: "fal-birefnet",
    cost: 5,
    model: BIREFNET_MODEL,
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
