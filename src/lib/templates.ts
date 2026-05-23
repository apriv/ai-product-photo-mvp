export const templates = [
  {
    name: "社媒海报",
    desc: "背景、灯光、海报感，适合小红书/Instagram",
    enabled: true,
  },
  {
    name: "白底商品展示图",
    desc: "白底主图、多角度、细节图排版",
    enabled: true,
  },
  {
    name: "仅抠图",
    desc: "适合后续加工",
    enabled: true,
  },
  {
    name: "占位预览",
    desc: "测试用 Placeholder (不调用API)",
    enabled: true,
  },
];

export function shouldUseOriginalUpload(template: string) {
  return template === "社媒海报" || template === "白底商品展示图";
}
