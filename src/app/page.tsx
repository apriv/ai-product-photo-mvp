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
    desc: "即将上线",
    enabled: false,
  },
  {
    name: "批量生成",
    desc: "即将上线",
    enabled: false,
  },
];

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState("抠图主图");
  const [loading, setLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0];

    if (selectedFile) {
      setFile(selectedFile);
      setImage(URL.createObjectURL(selectedFile));
      setGeneratedImage(null);
    }
  }, []);

  const handleGenerate = async () => {
    if (!file) return;

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("template", selectedTemplate);

      const response = await fetch("/api/generate", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "生成失败");
      }

      setGeneratedImage(data.imageUrl);
    } catch (error) {
      console.error(error);
      alert("生成失败，请查看 terminal 报错");
    } finally {
      setLoading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    multiple: false,
  });

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-3xl rounded-2xl bg-white p-8 shadow">
        <h1 className="text-3xl font-bold text-gray-900">AI 商品图生成器</h1>

        <p className="mt-3 text-gray-600">
          上传一张商品照片，快速生成适合电商使用的商品图。
        </p>

        <div
          {...getRootProps()}
          className={`mt-8 cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center transition ${
            isDragActive ? "border-black bg-gray-100" : "border-gray-300 bg-white"
          }`}
        >
          <input {...getInputProps()} />

          {image ? (
            <div>
              <img src={image} alt="preview" className="mx-auto max-h-80 rounded-xl" />
              <p className="mt-4 text-sm text-gray-500">点击或拖拽更换图片</p>
            </div>
          ) : (
            <div>
              <p className="text-lg font-medium text-gray-700">上传商品图片</p>
              <p className="mt-2 text-sm text-gray-500">点击选择图片，或拖拽上传</p>
            </div>
          )}
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4">
          {templates.map((item) => (
            <button
              key={item.name}
              disabled={!item.enabled}
              onClick={() => {
                if (item.enabled) {
                  setSelectedTemplate(item.name);
                  setGeneratedImage(null);
                }
              }}
              className={`rounded-xl border p-4 text-left transition ${
                !item.enabled
                  ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
                  : selectedTemplate === item.name
                    ? "border-black bg-gray-50"
                    : "border-gray-200 hover:border-black"
              }`}
            >
              <div className="font-medium">{item.name}</div>
              <div className="mt-1 text-sm opacity-70">{item.desc}</div>
            </button>
          ))}
        </div>

        <div className="mt-4 text-sm text-gray-500">
          当前选择：<span className="font-medium text-gray-900">{selectedTemplate}</span>
        </div>

        <button
          onClick={handleGenerate}
          disabled={!file || loading}
          className="mt-8 w-full rounded-xl bg-black py-3 font-medium text-white disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          {loading ? "生成中..." : "生成商品图"}
        </button>

        {generatedImage && (
          <div className="mt-8">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">生成结果</h2>

            <img
              src={generatedImage}
              alt="generated"
              className="rounded-2xl border bg-gray-100"
            />

            <a
              href={generatedImage}
              target="_blank"
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