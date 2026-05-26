"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { useDropzone } from "react-dropzone";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader, Tabs } from "@/components/ui";
import {
  compressImage,
  CompressionInfo,
  formatFileSize,
} from "@/lib/image-compression";
import { imageTemplates, getImageTemplate } from "@/features/image/templates";
import { posterFontClassName } from "@/features/poster/fonts";
import { renderPosterToDataUrl } from "@/features/poster/renderer";
import {
  defaultPosterText,
  getDefaultPosterText,
  getPosterFontSize,
  isPosterTextTooLong,
  posterTextTemplates,
  type PosterTemplateId,
  type PosterTextField,
  type PosterTextValues,
  type PosterTextTemplate,
} from "@/features/poster/text-templates";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const POSTER_TEMPLATE_NAME = "社媒海报";
const TITLE_TEMPLATE_NAME = "添加标题";

const debug = {
  log: (label: string, data?: unknown) => {
    console.log(`[${new Date().toISOString()}] [DEBUG] ${label}`, data || "");
  },
  error: (label: string, error?: unknown) => {
    console.error(`[${new Date().toISOString()}] [ERROR] ${label}`, error || "");
  },
  warn: (label: string, data?: unknown) => {
    console.warn(`[${new Date().toISOString()}] [WARN] ${label}`, data || "");
  },
};

export default function ImageGenerator() {
  const router = useRouter();
  const posterEditorRef = useRef<HTMLDivElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState("社媒海报");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [finalPosterImage, setFinalPosterImage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [compressionInfo, setCompressionInfo] =
    useState<CompressionInfo | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [planExpired, setPlanExpired] = useState(false);
  const [posterTemplateId, setPosterTemplateId] =
    useState<PosterTemplateId>("editorial");
  const [posterText, setPosterText] =
    useState<PosterTextValues>(defaultPosterText);
  const [posterRendering, setPosterRendering] = useState(false);

  const fetchWallet = useCallback(async () => {
    try {
      const r = await fetch("/api/account/wallet", { cache: "no-store" });
      if (r.status === 401) {
        router.replace("/login");
        return;
      }
      const data = await r.json();
      if (data?.wallet) {
        setBalance(data.wallet.balance);
        const expiresAt = data.wallet.planExpiresAt
          ? new Date(data.wallet.planExpiresAt).getTime()
          : null;
        setPlanExpired(
          Boolean(
            data.wallet.activePlanId && expiresAt && expiresAt < Date.now()
          )
        );
      }
    } catch {
      // ignore — wallet display is non-critical
    }
  }, [router]);

  useEffect(() => {
    const id = window.requestAnimationFrame(() => {
      fetchWallet();
    });
    return () => window.cancelAnimationFrame(id);
  }, [fetchWallet]);

  const selectedCost = getImageTemplate(selectedTemplate)?.cost ?? 0;
  const insufficient =
    balance !== null && balance < selectedCost && selectedCost > 0;
  const mobileStep = generatedImage ? 3 : file ? 2 : 1;
  const templateTabs = imageTemplates.map((item) => ({
    value: item.name,
    label: item.name,
    description: item.desc,
    meta: item.cost === 0 ? "免费" : `${item.cost} 积分`,
    disabled: !item.enabled,
  }));

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0];

    setErrorMessage("");
    setCompressionInfo(null);
    setFile(null);
    setImage(null);

    if (!selectedFile) return;

    if (selectedFile.size > MAX_FILE_SIZE) {
      setErrorMessage(
        `图片过大（${(selectedFile.size / 1024 / 1024).toFixed(1)}MB），限制 10MB`
      );
      return;
    }

    try {
      setStatus("压缩中...");
      const result = await compressImage(selectedFile);
      setFile(result.file);
      setImage(URL.createObjectURL(selectedFile));
      setCompressionInfo(result.info);
      setGeneratedImage(null);
      setFinalPosterImage(null);
      setStatus("");
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "图片处理失败，请尝试其他图片";
      debug.error("Image compression failed", { error: errorMsg });
      setErrorMessage(errorMsg);
      setStatus("");
    }
  }, []);

  const handleGenerate = async () => {
    if (!file) return;

    setLoading(true);
    setStatus("上传中...");
    setErrorMessage("");

    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("template", selectedTemplate);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 180000);

      const response = await fetch("/api/image/generate", {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      setStatus("生成中...");
      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch {
        throw new Error(
          `服务器响应错误 (${response.status}): ${responseText.substring(0, 100)}`
        );
      }

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      if (!response.ok || !data.success) {
        // 402 = insufficient credits / plan expired — refresh wallet so UI catches up
        if (response.status === 402) {
          fetchWallet();
        }
        throw new Error(data.error || "生成失败，请重试");
      }

      setGeneratedImage(data.imageUrl);
      setFinalPosterImage(null);
      setPosterText(getDefaultPosterText(posterTemplateId));
      setStatus("");
      fetchWallet();
    } catch (error) {
      debug.error("Generate request failed", {
        error: error instanceof Error ? error.message : String(error),
      });
      setErrorMessage(
        error instanceof Error ? error.message : "生成失败，请重试"
      );
      setStatus("");
    } finally {
      setLoading(false);
    }
  };

  const selectedPosterTemplate =
    posterTextTemplates.find((item) => item.id === posterTemplateId) ??
    posterTextTemplates[0];
  const isPosterFlow =
    (selectedTemplate === POSTER_TEMPLATE_NAME ||
      selectedTemplate === TITLE_TEMPLATE_NAME) &&
    Boolean(generatedImage);

  const handlePosterTextChange = (field: PosterTextField, value: string) => {
    setPosterText((current) => ({ ...current, [field]: value }));
    setFinalPosterImage(null);
  };

  const handleRenderPoster = async () => {
    if (!generatedImage) return;

    setPosterRendering(true);
    setErrorMessage("");

    try {
      const imageUrl = await renderPosterToDataUrl({
        imageUrl: generatedImage,
        template: selectedPosterTemplate,
        values: posterText,
      });
      setFinalPosterImage(imageUrl);
    } catch (error) {
      debug.error("Poster render failed", {
        error: error instanceof Error ? error.message : String(error),
      });
      setErrorMessage(
        error instanceof Error ? error.message : "海报渲染失败，请重试"
      );
    } finally {
      setPosterRendering(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    multiple: false,
    disabled: loading,
  });

  return (
    <div className={`space-y-4 ${posterFontClassName}`}>
      <PageHeader
        eyebrow="创建 / 图片"
        title="图片生成"
        description="上传商品图，选择生成方式，在右侧直接查看、编辑和下载结果。"
      />

      {errorMessage && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      <div className="grid gap-4 lg:h-[calc(100vh-12rem)] lg:min-h-[640px] lg:grid-cols-[360px_minmax(0,1fr)]">
        <section className="flex flex-col rounded-lg border border-gray-200 bg-white shadow-sm lg:min-h-0">
          <div className="border-b border-gray-200 px-4 py-3">
            <div className="flex items-center justify-between gap-3 text-sm">
              <div className="text-gray-600">
                余额：
                <span className="font-semibold text-gray-900">
                  {balance === null ? "—" : balance}
                </span>
                <span className="ml-1 text-gray-400">积分</span>
                {planExpired && (
                  <span className="ml-2 text-red-600">套餐已到期</span>
                )}
              </div>
              <Link
                href="/account"
                className="shrink-0 text-xs text-gray-500 underline hover:text-black"
              >
                激活 / 账户
              </Link>
            </div>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            <div className="flex items-center gap-2 text-xs font-medium text-gray-500 lg:hidden">
              <StepPill active={mobileStep === 1}>1 上传</StepPill>
              <StepPill active={mobileStep === 2}>2 生成</StepPill>
              <StepPill active={mobileStep === 3}>3 结果</StepPill>
            </div>

            <div>
              <div className="mb-2 flex items-baseline justify-between">
                <h2 className="text-sm font-semibold text-gray-950">
                  1. 上传商品图
                </h2>
                {file && (
                  <span className="text-xs text-gray-500">
                    {formatFileSize(file.size)}
                  </span>
                )}
              </div>
              <div
                {...getRootProps()}
                className={`cursor-pointer rounded-xl border-2 border-dashed p-4 text-center transition ${
                  isDragActive
                    ? "border-black bg-gray-100"
                    : "border-gray-300 bg-white"
                } ${loading ? "cursor-not-allowed opacity-50" : ""}`}
              >
                <input {...getInputProps()} />

                {status && !generatedImage ? (
                  <div className="flex min-h-36 items-center justify-center">
                    <p className="text-sm font-medium text-gray-700">
                      {status}
                    </p>
                  </div>
                ) : image ? (
                  <div>
                    <img
                      src={image}
                      alt="preview"
                      className="mx-auto max-h-40 rounded-lg object-contain"
                    />
                    <p className="mt-3 text-xs text-gray-500">
                      {compressionInfo?.wasCompressed
                        ? `已压缩: ${formatFileSize(
                            compressionInfo.originalSize
                          )} → ${formatFileSize(compressionInfo.compressedSize)}`
                        : "使用原图尺寸上传"}
                    </p>
                    {compressionInfo && (
                      <p className="text-xs text-gray-500">
                        {compressionInfo.width} × {compressionInfo.height}px
                      </p>
                    )}
                    <p className="mt-1 text-xs text-gray-400">
                      点击或拖拽更换图片
                    </p>
                  </div>
                ) : (
                  <div className="flex min-h-36 flex-col items-center justify-center">
                    <p className="text-sm font-medium text-gray-700">
                      上传商品图片
                    </p>
                    <p className="mt-2 max-w-56 text-xs leading-5 text-gray-500">
                      点击选择或拖拽上传，最大 10MB，会自动压缩到 1MB 内。
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-baseline justify-between">
                <h2 className="text-sm font-semibold text-gray-950">
                  2. 选择生成方式
                </h2>
                <span className="text-xs text-gray-500">
                  {selectedCost === 0 ? "免费" : `${selectedCost} 积分`}
                </span>
              </div>
              <Tabs
                items={templateTabs}
                value={selectedTemplate}
                disabled={loading}
                className="grid-cols-2 lg:grid-cols-1"
                onChange={(nextTemplate) => {
                  setSelectedTemplate(nextTemplate);
                  setGeneratedImage(null);
                  setFinalPosterImage(null);
                  setErrorMessage("");
                }}
              />
            </div>
          </div>

          <div className="border-t border-gray-200 p-4">
            <div className="mb-3 text-xs leading-5 text-gray-500">
              当前选择：
              <span className="font-medium text-gray-900">
                {selectedTemplate}
              </span>
              {selectedCost > 0 && (
                <span className="ml-1">本次将扣 {selectedCost} 积分</span>
              )}
            </div>
            {insufficient ? (
              <div className="flex items-center justify-between gap-3 rounded-lg border border-yellow-300 bg-yellow-50 px-3 py-3 text-sm text-yellow-800">
                <div>
                  积分不足（剩余 {balance}，需要 {selectedCost}）
                </div>
                <Link
                  href="/account"
                  className="shrink-0 rounded-lg bg-black px-3 py-2 text-white"
                >
                  去激活
                </Link>
              </div>
            ) : (
              <button
                onClick={handleGenerate}
                disabled={!file || loading || planExpired}
                className="w-full rounded-lg bg-black py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                {loading
                  ? `${status || "处理中..."}`
                  : planExpired
                    ? "套餐已到期，请先激活"
                    : selectedTemplate === TITLE_TEMPLATE_NAME
                      ? "开始添加标题"
                      : "生成商品图"}
              </button>
            )}
          </div>
        </section>

        <section className="min-h-[520px] rounded-lg border border-gray-200 bg-white shadow-sm lg:min-h-0 lg:overflow-y-auto">
          <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-gray-200 bg-white/95 px-4 py-3 backdrop-blur">
            <div>
              <h2 className="text-sm font-semibold text-gray-950">
                {generatedImage
                  ? isPosterFlow
                    ? "3. 编辑海报文字"
                    : "3. 生成结果"
                  : "3. 生成预览"}
              </h2>
              <p className="mt-1 text-xs text-gray-500">
                {generatedImage
                  ? "结果会保留在这里，可继续切换左侧模板重新生成。"
                  : "上传图片并点击生成后，结果会出现在这里。"}
              </p>
            </div>
            {generatedImage && !isPosterFlow && (
              <a
                href={generatedImage}
                download
                className="shrink-0 rounded-lg bg-black px-4 py-2 text-sm text-white"
              >
                打开/下载
              </a>
            )}
          </div>

          {generatedImage ? (
            isPosterFlow ? (
              <div className="grid gap-4 p-4 xl:grid-cols-[220px_minmax(360px,1fr)]">
                <div className="grid grid-cols-2 gap-2 xl:grid-cols-1 xl:self-start">
                  {posterTextTemplates.map((template) => (
                    <button
                      key={template.id}
                      type="button"
                      onClick={() => {
                        setPosterTemplateId(template.id);
                        setPosterText(template.defaultText);
                        setFinalPosterImage(null);
                      }}
                      className={`rounded-lg border p-3 text-left transition ${
                        posterTemplateId === template.id
                          ? "border-black bg-gray-50"
                          : "border-gray-200 hover:border-black"
                      }`}
                    >
                      <div className="text-sm font-semibold text-gray-900">
                        {template.name}
                      </div>
                      <div className="mt-1 text-xs leading-5 text-gray-500">
                        {template.desc}
                      </div>
                    </button>
                  ))}
                </div>

                <div className="min-w-0">
                  <div className="mx-auto max-w-[min(100%,560px)]">
                    <PosterEditor
                      editorRef={posterEditorRef}
                      imageUrl={generatedImage}
                      template={selectedPosterTemplate}
                      values={posterText}
                      onChange={handlePosterTextChange}
                    />
                  </div>

                  <div className="mx-auto mt-4 flex max-w-[min(100%,560px)] flex-wrap items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={handleRenderPoster}
                      disabled={posterRendering}
                      className="rounded-lg bg-black px-5 py-2 text-sm text-white disabled:cursor-not-allowed disabled:bg-gray-300"
                    >
                      {posterRendering ? "渲染中..." : "确认并生成海报"}
                    </button>
                    {finalPosterImage && (
                      <a
                        href={finalPosterImage}
                        download
                        className="rounded-lg border border-gray-300 px-5 py-2 text-sm text-gray-900 hover:border-black"
                      >
                        打开/下载
                      </a>
                    )}
                  </div>

                  {finalPosterImage && (
                    <div className="mx-auto mt-6 max-w-[min(100%,560px)]">
                      <h3 className="mb-3 text-sm font-semibold text-gray-900">
                        最终海报
                      </h3>
                      <img
                        src={finalPosterImage}
                        alt="final poster"
                        className="rounded-xl border bg-gray-100"
                      />
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex min-h-[460px] items-center justify-center p-4">
                <img
                  src={generatedImage}
                  alt="generated"
                  className="max-h-[calc(100vh-17rem)] rounded-xl border bg-gray-100 object-contain"
                  crossOrigin="anonymous"
                />
              </div>
            )
          ) : (
            <div className="flex min-h-[460px] flex-col items-center justify-center px-6 text-center">
              <div className="rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-500">
                等待生成
              </div>
              <p className="mt-4 max-w-sm text-sm leading-6 text-gray-500">
                桌面端左侧完成上传和选择，右侧会直接显示结果；手机端按上传、生成、结果顺序向下操作。
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function StepPill({
  active,
  children,
}: {
  active: boolean;
  children: ReactNode;
}) {
  return (
    <span
      className={`rounded-full border px-2.5 py-1 ${
        active
          ? "border-black bg-black text-white"
          : "border-gray-200 bg-gray-50 text-gray-500"
      }`}
    >
      {children}
    </span>
  );
}

type PosterEditorProps = {
  editorRef: RefObject<HTMLDivElement | null>;
  imageUrl: string;
  template: PosterTextTemplate;
  values: PosterTextValues;
  onChange: (field: PosterTextField, value: string) => void;
};

function PosterEditor({
  editorRef,
  imageUrl,
  template,
  values,
  onChange,
}: PosterEditorProps) {
  return (
    <div
      ref={editorRef}
      className="relative aspect-square overflow-hidden rounded-2xl border bg-gray-100"
      style={{ containerType: "inline-size" }}
    >
      <img
        src={imageUrl}
        alt="generated poster background"
        className="h-full w-full object-cover"
      />
      {template.overlay?.kind === "bottom-gradient" && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[45%] bg-gradient-to-b from-transparent to-black/70" />
      )}
      {(["title", "subtitle", "cta"] as PosterTextField[]).map((field) => (
        <PosterInlineTextInput
          key={field}
          field={field}
          template={template}
          value={values[field]}
          onChange={(value) => onChange(field, value)}
        />
      ))}
    </div>
  );
}

type PosterInlineTextInputProps = {
  field: PosterTextField;
  template: PosterTextTemplate;
  value: string;
  onChange: (value: string) => void;
};

function PosterInlineTextInput({
  field,
  template,
  value,
  onChange,
}: PosterInlineTextInputProps) {
  const box = template.fields[field];
  const fontSize = getPosterFontSize(value, box);
  const tooLong = isPosterTextTooLong(value, box);
  const left =
    box.align === "center"
      ? box.x - box.width / 2
      : box.align === "right"
        ? box.x - box.width
        : box.x;
  const commonStyle = {
    left: `${left}%`,
    top: `${box.y}%`,
    width: `${box.width}%`,
    color: box.color,
    fontFamily: box.fontFamily,
    fontWeight: box.fontWeight,
    fontSize: `${fontSize / 10.24}cqw`,
    lineHeight: box.lineHeight,
    textAlign: box.align,
    textTransform: box.uppercase ? "uppercase" : undefined,
    textShadow: box.shadow,
    transform: box.rotate ? `rotate(${box.rotate}deg)` : undefined,
    transformOrigin:
      box.align === "right"
        ? "100% 50%"
        : box.align === "center"
          ? "50% 50%"
          : "0 50%",
  } as const;

  if (field === "cta") {
    const justifyContent =
      box.align === "left"
        ? "flex-start"
        : box.align === "right"
          ? "flex-end"
          : "center";
    return (
      <div
        className="absolute flex"
        style={{ ...commonStyle, justifyContent }}
      >
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-label="CTA"
          className={`min-w-[7.5em] max-w-full rounded-full border bg-transparent px-[1.35em] py-[0.65em] text-center outline-none transition focus:border-white/80 ${
            tooLong ? "border-red-400" : "border-transparent"
          }`}
          style={{
            background: box.background?.color,
            color: box.color,
            borderRadius: box.background?.radius,
          }}
        />
      </div>
    );
  }

  return (
    <textarea
      value={value}
      onChange={(event) => onChange(event.target.value)}
      rows={box.maxLines}
      aria-label={field === "title" ? "标题" : "副标题"}
      className={`absolute resize-none overflow-hidden border bg-transparent outline-none transition focus:border-white/80 ${
        tooLong ? "border-red-400" : "border-transparent"
      }`}
      style={commonStyle}
    />
  );
}

function copyComputedStyle(source: Element, target: HTMLElement) {
  const computed = window.getComputedStyle(source);
  for (const property of Array.from(computed)) {
    target.style.setProperty(
      property,
      computed.getPropertyValue(property),
      computed.getPropertyPriority(property)
    );
  }
}

// Legacy helper, kept so other code referencing the function name (if any
// remains) continues to work. The renderer no longer uses it.
void copyComputedStyle;
