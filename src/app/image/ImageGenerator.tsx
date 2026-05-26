"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { useDropzone } from "react-dropzone";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui";
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
    <div className={`space-y-6 ${posterFontClassName}`}>
      <PageHeader
        eyebrow="Create / Image"
        title="Image Studio"
        description="上传一张商品照片，生成适合电商使用的商品图、海报、白底图或抠图结果。"
      />

      <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm sm:p-6">

        <div className="mt-3 flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm">
          <div className="text-gray-600">
            余额：
            <span className="font-semibold text-gray-900">
              {balance === null ? "—" : balance}
            </span>
            <span className="ml-1 text-gray-400">积分</span>
            {planExpired && (
              <span className="ml-3 text-red-600">套餐已到期</span>
            )}
          </div>
          <Link
            href="/account"
            className="text-xs text-gray-500 underline hover:text-black"
          >
            激活 / 账户
          </Link>
        </div>

        {errorMessage && (
          <div className="mt-6 rounded-lg bg-red-50 p-4 text-sm text-red-700 border border-red-200">
            {errorMessage}
          </div>
        )}

        <div
          {...getRootProps()}
          className={`mt-8 cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center transition ${
            isDragActive ? "border-black bg-gray-100" : "border-gray-300 bg-white"
          } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <input {...getInputProps()} />

          {status && (
            <div>
              <p className="text-lg font-medium text-gray-700">{status}</p>
            </div>
          )}

          {!status && image ? (
            <div>
              <img
                src={image}
                alt="preview"
                className="mx-auto max-h-80 rounded-xl"
              />
              <p className="mt-4 text-sm text-gray-500">
                {compressionInfo?.wasCompressed
                  ? `已压缩: ${formatFileSize(
                      compressionInfo.originalSize
                    )} → ${formatFileSize(compressionInfo.compressedSize)}`
                  : file && `文件: ${formatFileSize(file.size)}`}
              </p>
              {compressionInfo && (
                <p className="text-sm text-gray-500">
                  尺寸: {compressionInfo.width} × {compressionInfo.height}px
                </p>
              )}
              <p className="text-sm text-gray-500">
                ✓ 已准备好，使用压缩版本上传
              </p>
              <p className="text-sm text-gray-400 mt-2">点击或拖拽更换图片</p>
            </div>
          ) : !status ? (
            <div>
              <p className="text-lg font-medium text-gray-700">上传商品图片</p>
              <p className="mt-2 text-sm text-gray-500">
                点击选择图片，或拖拽上传（最大 10MB，将自动压缩到 1MB 内）
              </p>
            </div>
          ) : null}
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4">
          {imageTemplates.map((item) => (
            <button
              key={item.name}
              disabled={!item.enabled || loading}
              onClick={() => {
                if (item.enabled && !loading) {
                  setSelectedTemplate(item.name);
                  setGeneratedImage(null);
                  setFinalPosterImage(null);
                  setErrorMessage("");
                }
              }}
              className={`rounded-xl border p-4 text-left transition ${
                !item.enabled
                  ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
                  : selectedTemplate === item.name
                    ? "border-black bg-gray-50"
                    : "border-gray-200 hover:border-black"
              } ${loading ? "opacity-50" : ""}`}
            >
              <div className="flex items-baseline justify-between">
                <div className="font-medium">{item.name}</div>
                <div className="text-xs text-gray-500">
                  {item.cost === 0 ? "免费" : `${item.cost} 积分`}
                </div>
              </div>
              <div className="mt-1 text-sm opacity-70">{item.desc}</div>
            </button>
          ))}
        </div>

        <div className="mt-4 text-sm text-gray-500">
          当前选择：
          <span className="font-medium text-gray-900">{selectedTemplate}</span>
          {selectedCost > 0 && (
            <span className="ml-2 text-gray-500">
              · 本次将扣 {selectedCost} 积分
            </span>
          )}
        </div>

        {insufficient ? (
          <div className="mt-8 flex items-center justify-between rounded-xl border border-yellow-300 bg-yellow-50 px-5 py-4 text-sm text-yellow-800">
            <div>
              积分不足（剩余 {balance}，需要 {selectedCost}）
            </div>
            <Link
              href="/account"
              className="rounded-lg bg-black px-4 py-2 text-white"
            >
              去激活
            </Link>
          </div>
        ) : (
          <button
            onClick={handleGenerate}
            disabled={!file || loading || planExpired}
            className="mt-8 w-full rounded-xl bg-black py-3 font-medium text-white disabled:cursor-not-allowed disabled:bg-gray-300"
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

        {generatedImage && (
          <div className="mt-8">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">
              {isPosterFlow ? "编辑海报文字" : "生成结果"}
            </h2>
            {isPosterFlow ? (
              <div>
                <div className="mb-4 grid grid-cols-2 gap-3">
                  {posterTextTemplates.map((template) => (
                    <button
                      key={template.id}
                      type="button"
                      onClick={() => {
                        setPosterTemplateId(template.id);
                        setPosterText(template.defaultText);
                        setFinalPosterImage(null);
                      }}
                      className={`rounded-xl border p-3 text-left transition ${
                        posterTemplateId === template.id
                          ? "border-black bg-gray-50"
                          : "border-gray-200 hover:border-black"
                      }`}
                    >
                      <div className="text-sm font-semibold text-gray-900">
                        {template.name}
                      </div>
                      <div className="mt-1 text-xs text-gray-500">
                        {template.desc}
                      </div>
                    </button>
                  ))}
                </div>

                <div className="mx-auto max-w-xl">
                  <PosterEditor
                    editorRef={posterEditorRef}
                    imageUrl={generatedImage}
                    template={selectedPosterTemplate}
                    values={posterText}
                    onChange={handlePosterTextChange}
                  />
                </div>

                <div className="mx-auto mt-4 flex max-w-xl flex-wrap items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleRenderPoster}
                    disabled={posterRendering}
                    className="rounded-lg bg-black px-5 py-2 text-white disabled:cursor-not-allowed disabled:bg-gray-300"
                  >
                    {posterRendering ? "渲染中..." : "确认并生成海报"}
                  </button>
                  {finalPosterImage && (
                    <a
                      href={finalPosterImage}
                      download
                      className="rounded-lg border border-gray-300 px-5 py-2 text-gray-900 hover:border-black"
                    >
                      打开/下载图片
                    </a>
                  )}
                </div>

                {finalPosterImage && (
                  <div className="mx-auto mt-6 max-w-xl">
                    <h3 className="mb-3 text-base font-semibold text-gray-900">
                      最终海报
                    </h3>
                    <img
                      src={finalPosterImage}
                      alt="final poster"
                      className="rounded-2xl border bg-gray-100"
                    />
                  </div>
                )}
              </div>
            ) : (
              <>
                <img
                  src={generatedImage}
                  alt="generated"
                  className="rounded-2xl border bg-gray-100"
                  crossOrigin="anonymous"
                />
                <a
                  href={generatedImage}
                  download
                  className="mt-4 inline-block rounded-lg bg-black px-5 py-2 text-white"
                >
                  打开/下载图片
                </a>
              </>
            )}
          </div>
        )}
      </div>
    </div>
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
