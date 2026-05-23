"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";

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

async function compressImage(file: File): Promise<File> {
  if (file.size <= TARGET_SIZE) {
    return file;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        // 计算缩放尺寸
        const maxWidth = 2048;
        const maxHeight = 2048;
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, width, height);

        // 压缩质量直到达到目标大小
        let quality = 0.9;
        canvas.toBlob(
          (blob) => {
            const compressed = new File([blob!], file.name, {
              type: "image/jpeg",
            });
            resolve(compressed);
          },
          "image/jpeg",
          quality
        );
      };
    };
  });
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState("抠图主图");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0];
    setErrorMessage("");

    if (!selectedFile) return;

    // 检查文件大小
    if (selectedFile.size > MAX_FILE_SIZE) {
      setErrorMessage(`图片过大（${(selectedFile.size / 1024 / 1024).toFixed(1)}MB），限制 10MB`);
      return;
    }

    try {
      setStatus("压缩中...");
      const compressedFile = await compressImage(selectedFile);
      setFile(compressedFile);
      setImage(URL.createObjectURL(compressedFile));
      setGeneratedImage(null);
      setStatus("");
    } catch (error) {
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
                {file && `大小: ${(file.size / 1024 / 1024).toFixed(1)}MB`}
              </p>
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