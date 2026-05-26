"use client";

import { useMemo, useState } from "react";
import {
  Badge,
  Button,
  Card,
  Input,
  PageHeader,
  Tabs,
  Textarea,
  cn,
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
}> = [
  {
    value: "ad-title",
    label: "广告标题",
    description: "用于投放、商品卡片和落地页首屏。",
    meta: "5 条",
  },
  {
    value: "selling-points",
    label: "卖点提炼",
    description: "把商品描述整理成可直接放进详情页的卖点。",
    meta: "4 条",
  },
  {
    value: "cta",
    label: "CTA",
    description: "生成下单、咨询、领取优惠等行动引导。",
    meta: "6 条",
  },
  {
    value: "tiktok",
    label: "TikTok 短文案",
    description: "偏短、偏口语，适合短视频标题和简介。",
    meta: "3 条",
  },
  {
    value: "instagram",
    label: "Instagram 短文案",
    description: "偏生活方式表达，适合帖子和 Reels。",
    meta: "3 条",
  },
  {
    value: "video-script",
    label: "视频脚本",
    description: "预留 hook、镜头段落、字幕和结尾 CTA。",
    meta: "结构化",
  },
];

const toneOptions = ["清晰直接", "高端质感", "活泼口语", "限时促销"];
const audienceOptions = ["新访客", "老客户", "价格敏感用户", "礼品购买者"];

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
      id: "script-hook",
      label: "开头 Hook",
      body: "Placeholder hook: name the problem, reveal the product, and create a reason to keep watching.",
      tone: "warning",
    },
    {
      id: "script-shot-1",
      label: "镜头 1",
      body: "Placeholder shot paragraph: show the product in context with one clear visual action.",
    },
    {
      id: "script-shot-2",
      label: "镜头 2",
      body: "Placeholder shot paragraph: zoom into the key detail or transformation.",
    },
    {
      id: "script-subtitle",
      label: "字幕文案",
      body: "Placeholder subtitle line that can sit on top of the generated video.",
    },
    {
      id: "script-cta",
      label: "结尾 CTA",
      body: "Placeholder closing CTA for purchase, inquiry, or coupon collection.",
      tone: "success",
    },
  ],
};

export default function CopyStudio() {
  const [mode, setMode] = useState<CopyMode>("ad-title");
  const [productName, setProductName] = useState("");
  const [productContext, setProductContext] = useState("");
  const [imageContext, setImageContext] = useState("");
  const [tone, setTone] = useState(toneOptions[0]);
  const [audience, setAudience] = useState(audienceOptions[0]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [generationSeed, setGenerationSeed] = useState(1);

  const selectedMode = copyModes.find((item) => item.value === mode) ?? copyModes[0];
  const results = useMemo(
    () =>
      placeholderByMode[mode].map((item) => ({
        ...item,
        body: `${item.body}\n\nContext placeholder: ${
          productName || "Product name"
        } · ${tone} · ${audience} · draft ${generationSeed}`,
      })),
    [audience, generationSeed, mode, productName, tone]
  );

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
    <div className="space-y-4">
      <PageHeader
        eyebrow="创建 / 文案"
        title="文案生成"
        description="Placeholder copy studio for titles, selling points, CTAs, social captions, and video script drafts."
        actions={
          <Button type="button" onClick={() => setGenerationSeed((v) => v + 1)}>
            重新生成
          </Button>
        }
      />

      <div className="grid gap-4 lg:h-[calc(100vh-12rem)] lg:min-h-[660px] lg:grid-cols-[380px_minmax(0,1fr)]">
        <section className="flex flex-col rounded-lg border border-gray-200 bg-white shadow-sm lg:min-h-0">
          <div className="border-b border-gray-200 px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-gray-950">
                  输入上下文
                </div>
                <div className="text-xs text-gray-500">
                  后续文字 API 将读取这里的字段
                </div>
              </div>
              <Badge tone="warning">Placeholder</Badge>
            </div>
          </div>

          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4">
            <Field label="商品名称">
              <Input
                value={productName}
                onChange={(event) => setProductName(event.target.value)}
                placeholder="Placeholder product name"
              />
            </Field>

            <Field label="商品描述">
              <Textarea
                value={productContext}
                onChange={(event) => setProductContext(event.target.value)}
                placeholder="Placeholder product description, ingredients, audience, offer, or differentiators."
                className="min-h-32"
              />
            </Field>

            <Field label="图片结果上下文">
              <Textarea
                value={imageContext}
                onChange={(event) => setImageContext(event.target.value)}
                placeholder="Placeholder image context: generated poster, product photo style, visible scene, or asset id."
                className="min-h-24"
              />
            </Field>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <Field label="语气">
                <SelectPills
                  value={tone}
                  options={toneOptions}
                  onChange={setTone}
                />
              </Field>
              <Field label="受众">
                <SelectPills
                  value={audience}
                  options={audienceOptions}
                  onChange={setAudience}
                />
              </Field>
            </div>

            <Field label="生成类型">
              <Tabs
                items={copyModes}
                value={mode}
                onChange={(value) => setMode(value as CopyMode)}
              />
            </Field>
          </div>
        </section>

        <section className="flex min-h-[620px] flex-col rounded-lg border border-gray-200 bg-white shadow-sm lg:min-h-0">
          <div className="border-b border-gray-200 px-4 py-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold text-gray-950">
                    {selectedMode.label}
                  </h2>
                  <Badge tone="neutral">{selectedMode.meta}</Badge>
                </div>
                <p className="mt-1 text-xs leading-5 text-gray-500">
                  {selectedMode.description}
                </p>
              </div>
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
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            <div className="grid gap-3 xl:grid-cols-2">
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
                      <Badge tone={saved ? "success" : "neutral"}>
                        {saved ? "已保存" : "草稿"}
                      </Badge>
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

            <div className="mt-4 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-sm leading-6 text-gray-600">
              当前保存与复制为前端状态。文字 API、素材库写入和图片生成结果引用将在后续接入。
            </div>
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

function SelectPills({
  value,
  options,
  onChange,
}: {
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="grid gap-2">
      {options.map((option) => {
        const active = option === value;
        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={cn(
              "min-h-10 rounded-lg border px-3 py-2 text-left text-sm transition",
              active
                ? "border-gray-950 bg-gray-50 text-gray-950"
                : "border-gray-200 bg-white text-gray-600 hover:border-gray-400"
            )}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}
