"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  compressImage,
  CompressionInfo,
  formatFileSize,
} from "@/lib/image-compression";
import { imageTemplates } from "@/features/image/templates";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

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
  const [file, setFile] = useState<File | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState("社媒海报");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [compressionInfo, setCompressionInfo] =
    useState<CompressionInfo | null>(null);

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
        throw new Error(data.error || "生成失败，请重试");
      }

      setGeneratedImage(data.imageUrl);
      setStatus("");
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

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    multiple: false,
    disabled: loading,
  });

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-3xl rounded-2xl bg-white p-8 shadow">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">AI 商品图生成器</h1>
          <Link href="/" className="text-sm text-gray-500 hover:text-black">
            ← 返回首页
          </Link>
        </div>

        <p className="mt-3 text-gray-600">
          上传一张商品照片，快速生成适合电商使用的商品图。
        </p>

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
              <div className="font-medium">{item.name}</div>
              <div className="mt-1 text-sm opacity-70">{item.desc}</div>
            </button>
          ))}
        </div>

        <div className="mt-4 text-sm text-gray-500">
          当前选择：
          <span className="font-medium text-gray-900">{selectedTemplate}</span>
        </div>

        <button
          onClick={handleGenerate}
          disabled={!file || loading}
          className="mt-8 w-full rounded-xl bg-black py-3 font-medium text-white disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          {loading ? `${status || "处理中..."}` : "生成商品图"}
        </button>

        {generatedImage && (
          <div className="mt-8">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">
              生成结果
            </h2>
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
          </div>
        )}
      </div>
    </main>
  );
}
