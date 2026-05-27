"use client";

import { useState } from "react";
import {
  Badge,
  Button,
  Card,
  Input,
  Tabs,
  Textarea,
} from "@/components/ui";

type CopyMode =
  | "ad-title"
  | "selling-points"
  | "cta"
  | "tiktok"
  | "instagram"
  | "video-script";

type CopyResult = {
  id: string;
  label: string;
  body: string;
  tone?: "neutral" | "success" | "warning";
};

const copyModes: Array<{
  value: CopyMode;
  label: string;
  description: string;
  meta: string;
  disabled?: boolean;
}> = [
  {
    value: "video-script",
    label: "视频脚本",
    description: "预留 hook、镜头段落、字幕和结尾 CTA。",
    meta: "",
  },
  {
    value: "ad-title",
    label: "商品标题",
    description: "用于投放、商品卡片和落地页首屏。",
    meta: "待开放",
    disabled: true,
  },
  {
    value: "selling-points",
    label: "卖点提炼",
    description: "把商品描述整理成可直接放进详情页的卖点。",
    meta: "待开放",
    disabled: true,
  },
  {
    value: "cta",
    label: "CTA",
    description: "生成下单、咨询、领取优惠等行动引导。",
    meta: "待开放",
    disabled: true,
  },
  {
    value: "tiktok",
    label: "TikTok 短文案",
    description: "偏短、偏口语，适合短视频标题和简介。",
    meta: "待开放",
    disabled: true,
  },
  {
    value: "instagram",
    label: "Instagram 短文案",
    description: "偏生活方式表达，适合帖子和 Reels。",
    meta: "待开放",
    disabled: true,
  },
];

const placeholderByMode: Record<CopyMode, CopyResult[]> = {
  "ad-title": [
    {
      id: "title-1",
      label: "标题 A",
      body: "Placeholder headline focused on the product's clearest benefit.",
    },
    {
      id: "title-2",
      label: "标题 B",
      body: "Placeholder headline with a sharper offer and a compact hook.",
    },
    {
      id: "title-3",
      label: "标题 C",
      body: "Placeholder headline for paid social testing and fast scanning.",
    },
    {
      id: "title-4",
      label: "标题 D",
      body: "Placeholder headline that frames the product as an everyday upgrade.",
    },
    {
      id: "title-5",
      label: "标题 E",
      body: "Placeholder headline reserved for seasonal campaign wording.",
    },
  ],
  "selling-points": [
    {
      id: "point-1",
      label: "卖点 1",
      body: "Placeholder selling point extracted from product material, use case, or visual proof.",
    },
    {
      id: "point-2",
      label: "卖点 2",
      body: "Placeholder selling point describing the most obvious customer outcome.",
    },
    {
      id: "point-3",
      label: "卖点 3",
      body: "Placeholder selling point for comparison, bundle value, or daily convenience.",
    },
    {
      id: "point-4",
      label: "卖点 4",
      body: "Placeholder selling point that can become subtitle copy in a poster.",
    },
  ],
  cta: [
    {
      id: "cta-1",
      label: "CTA A",
      body: "Placeholder CTA for a direct purchase action.",
    },
    {
      id: "cta-2",
      label: "CTA B",
      body: "Placeholder CTA for limited-time offer wording.",
    },
    {
      id: "cta-3",
      label: "CTA C",
      body: "Placeholder CTA for consultation or message-based conversion.",
    },
    {
      id: "cta-4",
      label: "CTA D",
      body: "Placeholder CTA for collecting coupons or joining a waitlist.",
    },
    {
      id: "cta-5",
      label: "CTA E",
      body: "Placeholder CTA for repeat visitors who need a lighter nudge.",
    },
    {
      id: "cta-6",
      label: "CTA F",
      body: "Placeholder CTA for post content and short captions.",
    },
  ],
  tiktok: [
    {
      id: "tt-1",
      label: "TikTok A",
      body: "Placeholder short caption with a quick hook, product payoff, and soft CTA.",
    },
    {
      id: "tt-2",
      label: "TikTok B",
      body: "Placeholder short caption written for fast scrolling and casual discovery.",
    },
    {
      id: "tt-3",
      label: "TikTok C",
      body: "Placeholder short caption that pairs with a before-and-after visual.",
    },
  ],
  instagram: [
    {
      id: "ig-1",
      label: "Instagram A",
      body: "Placeholder caption with lifestyle framing, product context, and a clean CTA.",
    },
    {
      id: "ig-2",
      label: "Instagram B",
      body: "Placeholder caption for a product photo carousel or Reels cover.",
    },
    {
      id: "ig-3",
      label: "Instagram C",
      body: "Placeholder caption with a polished but concise brand voice.",
    },
  ],
  "video-script": [
    {
      id: "script-seeding",
      label: "种草视频",
      body: "开头用一个生活化场景带出需求，镜头快速展示商品外观和使用方式。中段突出一个最容易被理解的卖点，搭配近景细节和轻松口播。结尾引导用户收藏或点击了解更多。",
    },
    {
      id: "script-premium",
      label: "高级感广告",
      body: "画面以干净背景和慢节奏运镜开场，先展示商品质感，再切到关键细节。旁白保持简短克制，强调设计、体验和品质感。结尾用品牌式收束，留下清晰记忆点。",
    },
    {
      id: "script-feature",
      label: "功能展示",
      body: "第一镜头直接说明商品解决的问题，第二镜头展示核心功能的操作过程，第三镜头对比使用前后的变化。字幕用短句解释重点，结尾提醒用户按需选择或立即下单。",
    },
  ],
};

export default function CopyStudio() {
  const [mode, setMode] = useState<CopyMode>("video-script");
  const [productName, setProductName] = useState("");
  const [productContext, setProductContext] = useState("");
  const [imageFileName, setImageFileName] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [results, setResults] = useState<CopyResult[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState("");

  const selectedMode = copyModes.find((item) => item.value === mode) ?? copyModes[0];

  function buildResultCards(seedingBody: string) {
    return placeholderByMode[mode].map((item) => ({
      ...item,
      body:
        item.id === "script-seeding"
          ? seedingBody
          : `${item.body}${
              productName ? `\n\n参考商品：${productName}` : ""
            }${productContext ? `\n参考描述：${productContext}` : ""}${
              imageFileName ? `\n参考图片：${imageFileName}` : ""
            }`,
    }));
  }

  async function generateCopy() {
    setSavedIds([]);
    setCopiedId(null);
    setGenerationError("");
    setIsGenerating(true);

    try {
      const response = await fetch("/api/copy/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productTitle: productName,
          productDescription: productContext,
        }),
      });
      const data = (await response.json()) as {
        success?: boolean;
        text?: string;
        error?: string;
      };

      if (!response.ok || !data.success || !data.text) {
        throw new Error(data.error || "生成失败");
      }

      setResults(buildResultCards(data.text));
    } catch (error) {
      setResults([]);
      setGenerationError(
        error instanceof Error ? error.message : "生成失败，请稍后重试"
      );
    } finally {
      setIsGenerating(false);
    }
  }

  async function copyResult(result: CopyResult) {
    await navigator.clipboard.writeText(result.body);
    setCopiedId(result.id);
    window.setTimeout(() => setCopiedId(null), 1600);
  }

  function toggleSaved(id: string) {
    setSavedIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  }

  return (
    <div>
      <div className="grid gap-4 lg:h-[calc(100vh-7rem)] lg:min-h-0 lg:grid-cols-[360px_minmax(0,1fr)]">
        <section className="flex flex-col rounded-lg border border-gray-200 bg-white shadow-sm lg:min-h-0">
          <div className="border-b border-gray-200 px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-gray-950">
                  商品信息
                </div>
                <div className="text-xs text-gray-500">
                  名称、描述和图片均可选
                </div>
              </div>
              <Button
                type="button"
                className="h-9 px-3"
                disabled={isGenerating}
                onClick={generateCopy}
              >
                {isGenerating ? "生成中..." : "生成"}
              </Button>
            </div>
          </div>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
            <Field label="商品名称">
              <Input
                value={productName}
                onChange={(event) => setProductName(event.target.value)}
                placeholder="商品名称（可选）"
              />
            </Field>

            <Field label="商品描述">
              <Textarea
                value={productContext}
                onChange={(event) => setProductContext(event.target.value)}
                placeholder="商品描述、卖点、适用场景或优惠信息（可选）"
                className="min-h-32"
              />
            </Field>

            <Field label="图片">
              <label className="flex min-h-24 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-5 text-center transition hover:border-gray-400 hover:bg-white">
                <span className="text-sm font-medium text-gray-800">
                  {imageFileName || "上传图片（可选）"}
                </span>
                <span className="mt-1 text-xs text-gray-500">
                  支持商品图、场景图或已有素材
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(event) => {
                    setImageFileName(event.target.files?.[0]?.name ?? "");
                  }}
                />
              </label>
            </Field>

            <Field label="生成类型">
              <Tabs
                items={copyModes}
                value={mode}
                onChange={(value) => setMode(value as CopyMode)}
              />
            </Field>
          </div>
        </section>

        <section className="flex min-h-[560px] flex-col rounded-lg border border-gray-200 bg-white shadow-sm lg:min-h-0">
          <div className="border-b border-gray-200 px-4 py-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold text-gray-950">
                    {selectedMode.label}
                  </h2>
                  {selectedMode.meta && (
                    <Badge tone="neutral">{selectedMode.meta}</Badge>
                  )}
                </div>
                <p className="mt-1 text-xs leading-5 text-gray-500">
                  {selectedMode.description}
                </p>
              </div>
              {results.length > 0 && (
                <div className="flex gap-2">
                  <Button
                    type="button"
                    tone="secondary"
                    onClick={() => setSavedIds(results.map((item) => item.id))}
                  >
                    全部保存
                  </Button>
                  <Button
                    type="button"
                    tone="secondary"
                    onClick={() => {
                      const text = results.map((item) => `${item.label}\n${item.body}`).join("\n\n");
                      navigator.clipboard.writeText(text);
                    }}
                  >
                    全部复制
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            {results.length > 0 ? (
              <div className="grid gap-3 xl:grid-cols-3">
                {results.map((result) => {
                  const saved = savedIds.includes(result.id);
                  const copied = copiedId === result.id;

                  return (
                    <Card key={result.id} className="flex min-h-44 flex-col p-4 shadow-none">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold text-gray-950">
                            {result.label}
                          </h3>
                          {result.tone && <Badge tone={result.tone}>脚本</Badge>}
                        </div>
                        {saved && <Badge tone="success">已保存</Badge>}
                      </div>
                      <p className="mt-3 flex-1 whitespace-pre-line text-sm leading-6 text-gray-700">
                        {result.body}
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button
                          type="button"
                          tone="secondary"
                          onClick={() => copyResult(result)}
                        >
                          {copied ? "已复制" : "复制"}
                        </Button>
                        <Button
                          type="button"
                          tone={saved ? "ghost" : "secondary"}
                          onClick={() => toggleSaved(result.id)}
                        >
                          {saved ? "取消保存" : "保存到素材库"}
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="flex h-full min-h-80 items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50 px-6 text-center text-sm text-gray-500">
                {generationError || "填写任意商品信息后点击生成，脚本结果会显示在这里。"}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <span className="mb-2 block text-sm font-medium text-gray-800">
        {label}
      </span>
      {children}
    </div>
  );
}
