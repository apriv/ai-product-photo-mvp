export const VIDEO_MODEL =
  "fal-ai/kling-video/v2.5-turbo/pro/image-to-video";

export type VideoTemplate = {
  id: string;
  name: string;
  desc: string;
  prompt: string;
  duration: "5" | "10";
  cost: number;
};

export const videoTemplates: VideoTemplate[] = [
  {
    id: "product-orbit",
    name: "商品环绕",
    desc: "平稳环绕商品，突出外观、材质与包装细节。",
    prompt:
      "A polished commercial product shot. The camera slowly orbits around the product, revealing its form, material, and packaging details. Stable motion, premium studio lighting, realistic, no text.",
    duration: "5",
    cost: 80,
  },
  {
    id: "lifestyle-push",
    name: "生活方式",
    desc: "轻缓推进镜头，适合种草与社媒短视频。",
    prompt:
      "A modern lifestyle product commercial. The camera gently pushes toward the product while natural light shifts subtly across the scene. Refined, inviting, realistic motion, no text.",
    duration: "5",
    cost: 80,
  },
  {
    id: "detail-reveal",
    name: "细节展示",
    desc: "以近景运镜强调功能、纹理和关键卖点。",
    prompt:
      "A premium macro product reveal. The camera glides slowly across the product and settles on its most important detail. Crisp texture, controlled cinematic lighting, realistic, no text.",
    duration: "5",
    cost: 80,
  },
];

export function getVideoTemplate(id: string) {
  return videoTemplates.find((template) => template.id === id);
}
