"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import {
  ACCESS_PASSWORD_FIELD,
  ACCESS_PASSWORD_STORAGE_KEY,
} from "@/lib/access-shared";

const templates = [
  {
    name: "抠图主图",
    desc: "去背景，商品居中，适合后续上架",
    enabled: true,
  },
  {
    name: "社媒海报",
    desc: "背景、灯光、海报感，适合小红书/Instagram",
    enabled: true,
  },
  {
    name: "白底主图",
    desc: "测试用 Placeholder (不调用API)",
    enabled: true,
  },
  {
    name: "批量生成",
    desc: "即将上线",
    enabled: false,
  },
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const TARGET_SIZE = 2 * 1024 * 1024; // 2MB target after compression
const MAX_IMAGE_EDGE = 2048;
const MIN_JPEG_QUALITY = 0.55;
const INITIAL_JPEG_QUALITY = 0.9;
const QUALITY_STEP = 0.08;

type CompressionInfo = {
  originalSize: number;
  compressedSize: number;
  width: number;
  height: number;
  wasCompressed: boolean;
};

type CompressionResult = {
  file: File;
  info: CompressionInfo;
};

function formatFileSize(bytes: number) {
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}

function getJpegFileName(fileName: string) {
  const baseName = fileName.replace(/\.[^.]+$/, "");
  return `${baseName || "image"}.jpg`;
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("图片读取失败"));
    reader.onload = (event) => {
      const image = new Image();
      image.onerror = () => reject(new Error("图片加载失败"));
      image.onload = () => resolve(image);
      image.src = String(event.target?.result || "");
    };
    reader.readAsDataURL(file);
  });
}

function calculateSize(width: number, height: number, maxEdge: number) {
  const scale = Math.min(1, maxEdge / Math.max(width, height));
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("图片压缩失败"));
          return;
        }
        resolve(blob);
      },
      "image/jpeg",
      quality
    );
  });
}

async function compressImage(file: File): Promise<CompressionResult> {
  if (file.size <= TARGET_SIZE) {
    const image = await loadImage(file);
    return {
      file,
      info: {
        originalSize: file.size,
        compressedSize: file.size,
        width: image.naturalWidth,
        height: image.naturalHeight,
        wasCompressed: false,
      },
    };
  }

  const image = await loadImage(file);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("浏览器不支持图片压缩");
  }

  let maxEdge = MAX_IMAGE_EDGE;
  let bestBlob: Blob | null = null;
  let finalWidth = image.naturalWidth;
  let finalHeight = image.naturalHeight;

  for (let resizeRound = 0; resizeRound < 4; resizeRound += 1) {
    const size = calculateSize(image.naturalWidth, image.naturalHeight, maxEdge);
    canvas.width = size.width;
    canvas.height = size.height;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, size.width, size.height);
    ctx.drawImage(image, 0, 0, size.width, size.height);

    finalWidth = size.width;
    finalHeight = size.height;

    for (
      let quality = INITIAL_JPEG_QUALITY;
      quality >= MIN_JPEG_QUALITY;
      quality -= QUALITY_STEP
    ) {
      const blob = await canvasToBlob(canvas, Number(quality.toFixed(2)));
      bestBlob = blob;

      if (blob.size <= TARGET_SIZE) {
        return {
          file: new File([blob], getJpegFileName(file.name), {
            type: "image/jpeg",
          }),
          info: {
            originalSize: file.size,
            compressedSize: blob.size,
            width: finalWidth,
            height: finalHeight,
            wasCompressed: true,
          },
        };
      }
    }

    maxEdge = Math.round(maxEdge * 0.85);
  }

  if (!bestBlob) {
    throw new Error("图片压缩失败");
  }

  return {
    file: new File([bestBlob], getJpegFileName(file.name), {
      type: "image/jpeg",
    }),
    info: {
      originalSize: file.size,
      compressedSize: bestBlob.size,
      width: finalWidth,
      height: finalHeight,
      wasCompressed: true,
    },
  };
}

export default function Home() {
  const [accessPassword, setAccessPassword] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [accessLoading, setAccessLoading] = useState(false);
  const [accessError, setAccessError] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState("抠图主图");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [compressionInfo, setCompressionInfo] =
    useState<CompressionInfo | null>(null);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      const savedPassword = localStorage.getItem(ACCESS_PASSWORD_STORAGE_KEY);
      if (!savedPassword) {
        return;
      }

      setAccessPassword(savedPassword);

      fetch("/api/access", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          [ACCESS_PASSWORD_FIELD]: savedPassword,
        }),
      })
        .then(async (response) => {
          const data = await response.json();
          if (!response.ok || !data.success) {
            throw new Error(data.error || "访问密码错误");
          }
          setIsUnlocked(true);
        })
        .catch(() => {
          localStorage.removeItem(ACCESS_PASSWORD_STORAGE_KEY);
          setAccessPassword("");
        });
    });

    return () => window.cancelAnimationFrame(frameId);
  }, []);

  const handleUnlock = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!accessPassword) {
      setAccessError("请输入访问密码");
      return;
    }

    setAccessLoading(true);
    setAccessError("");

    try {
      const response = await fetch("/api/access", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          [ACCESS_PASSWORD_FIELD]: accessPassword,
        }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "访问密码错误");
      }

      localStorage.setItem(ACCESS_PASSWORD_STORAGE_KEY, accessPassword);
      setIsUnlocked(true);
    } catch (error) {
      localStorage.removeItem(ACCESS_PASSWORD_STORAGE_KEY);
      setAccessError(error instanceof Error ? error.message : "访问密码错误");
    } finally {
      setAccessLoading(false);
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0];
    setErrorMessage("");
    setCompressionInfo(null);

    if (!selectedFile) return;

    // 检查文件大小
    if (selectedFile.size > MAX_FILE_SIZE) {
      setErrorMessage(`图片过大（${(selectedFile.size / 1024 / 1024).toFixed(1)}MB），限制 10MB`);
      return;
    }

    try {
      setStatus("压缩中...");
      const result = await compressImage(selectedFile);
      setFile(result.file);
      setImage(URL.createObjectURL(result.file));
      setCompressionInfo(result.info);
      setGeneratedImage(null);
      setStatus("");
    } catch {
      setErrorMessage("图片处理失败，请尝试其他图片");
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
      formData.append(ACCESS_PASSWORD_FIELD, accessPassword);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 180000); // 3分钟超时

      const response = await fetch("/api/generate", {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      setStatus("生成中...");

      const data = await response.json();

      if (response.status === 401) {
        localStorage.removeItem(ACCESS_PASSWORD_STORAGE_KEY);
        setIsUnlocked(false);
        setAccessPassword("");
      }

      if (!response.ok || !data.success) {
        throw new Error(data.error || "生成失败，请重试");
      }

      setGeneratedImage(data.imageUrl);
      setStatus("");
    } catch (error) {
      console.error(error);
      const errorMsg =
        error instanceof Error ? error.message : "生成失败，请重试";
      setErrorMessage(errorMsg);
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

  if (!isUnlocked) {
    return (
      <main className="min-h-screen bg-gray-50 px-6 py-10">
        <div className="mx-auto max-w-md rounded-2xl bg-white p-8 shadow">
          <h1 className="text-3xl font-bold text-gray-900">AI 商品图生成器</h1>

          <form onSubmit={handleUnlock} className="mt-8">
            <label
              htmlFor="access-password"
              className="text-sm font-medium text-gray-700"
            >
              访问密码
            </label>
            <input
              id="access-password"
              type="password"
              value={accessPassword}
              onChange={(event) => {
                setAccessPassword(event.target.value);
                setAccessError("");
              }}
              className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-black"
              autoComplete="current-password"
            />

            {accessError && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {accessError}
              </div>
            )}

            <button
              type="submit"
              disabled={accessLoading}
              className="mt-6 w-full rounded-xl bg-black py-3 font-medium text-white disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              {accessLoading ? "校验中..." : "进入"}
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-3xl rounded-2xl bg-white p-8 shadow">
        <h1 className="text-3xl font-bold text-gray-900">AI 商品图生成器</h1>

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
                    )} -> ${formatFileSize(compressionInfo.compressedSize)}`
                  : file && `大小: ${formatFileSize(file.size)}`}
              </p>
              {compressionInfo && (
                <p className="text-sm text-gray-500">
                  尺寸: {compressionInfo.width} x {compressionInfo.height}
                </p>
              )}
              <p className="text-sm text-gray-500">点击或拖拽更换图片</p>
            </div>
          ) : !status ? (
            <div>
              <p className="text-lg font-medium text-gray-700">上传商品图片</p>
              <p className="mt-2 text-sm text-gray-500">
                点击选择图片，或拖拽上传 (最大 10MB)
              </p>
            </div>
          ) : null}
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4">
          {templates.map((item) => (
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
            <h2 className="mb-4 text-xl font-semibold text-gray-900">生成结果</h2>

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
