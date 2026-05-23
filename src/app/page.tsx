"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import {
  ACCESS_PASSWORD_FIELD,
  ACCESS_PASSWORD_STORAGE_KEY,
} from "@/lib/access-shared";
import {
  compressImage,
  CompressionInfo,
  formatFileSize,
} from "@/lib/image-compression";
import { shouldUseOriginalUpload, templates } from "@/lib/templates";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// 调试日志工具
const debug = {
  log: (label: string, data?: unknown) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [DEBUG] ${label}`, data || "");
  },
  error: (label: string, error?: unknown) => {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] [ERROR] ${label}`, error || "");
  },
  warn: (label: string, data?: unknown) => {
    const timestamp = new Date().toISOString();
    console.warn(`[${timestamp}] [WARN] ${label}`, data || "");
  },
};

export default function Home() {
  const [accessPassword, setAccessPassword] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [accessLoading, setAccessLoading] = useState(false);
  const [accessError, setAccessError] = useState("");
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState("社媒海报");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [compressionInfo, setCompressionInfo] =
    useState<CompressionInfo | null>(null);
  const [serverVersion, setServerVersion] = useState<string>("");
  const [clientVersion] = useState<string>(new Date().getTime().toString());

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      debug.log("App initialized", { clientVersion });
      
      const savedPassword = localStorage.getItem(ACCESS_PASSWORD_STORAGE_KEY);
      if (!savedPassword) {
        return;
      }

      setAccessPassword(savedPassword);
      debug.log("Attempting auto-login with saved password");

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
          debug.log("Access validation response", { status: response.status, success: data.success, version: data.version });
          
          if (data.version) {
            setServerVersion(data.version);
            debug.log("Server version detected", { serverVersion: data.version, clientVersion });
          }
          
          if (!response.ok || !data.success) {
            throw new Error(data.error || "访问密码错误");
          }
          setIsUnlocked(true);
          debug.log("Auto-login successful");
        })
        .catch((error) => {
          debug.error("Auto-login failed", error);
          localStorage.removeItem(ACCESS_PASSWORD_STORAGE_KEY);
          setAccessPassword("");
        });
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [clientVersion]);

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
    
    debug.log("File drop/select", {
      fileName: selectedFile?.name,
      fileSize: selectedFile?.size,
      fileSizeMB: selectedFile ? (selectedFile.size / 1024 / 1024).toFixed(2) : "N/A",
      mimeType: selectedFile?.type,
    });

    setErrorMessage("");
    setCompressionInfo(null);
    setOriginalFile(null);
    setFile(null);
    setImage(null);

    if (!selectedFile) {
      debug.warn("No file selected");
      return;
    }

    // 检查文件大小
    if (selectedFile.size > MAX_FILE_SIZE) {
      const errorMsg = `图片过大（${(selectedFile.size / 1024 / 1024).toFixed(1)}MB），限制 10MB`;
      debug.warn("File too large", { fileSize: selectedFile.size, maxSize: MAX_FILE_SIZE });
      setErrorMessage(errorMsg);
      return;
    }

    try {
      setStatus("压缩中...");
      const result = await compressImage(selectedFile);
      
      debug.log("Image compression completed", {
        originalSize: result.info.originalSize,
        compressedSize: result.info.compressedSize,
        width: result.info.width,
        height: result.info.height,
        wasCompressed: result.info.wasCompressed,
        ratio: result.info.wasCompressed 
          ? ((1 - result.info.compressedSize / result.info.originalSize) * 100).toFixed(1) + "%"
          : "no compression",
      });

      setOriginalFile(selectedFile);
      setFile(result.file);
      setImage(URL.createObjectURL(selectedFile));
      setCompressionInfo(result.info);
      setGeneratedImage(null);
      setStatus("");
    } catch (error) {
      debug.error("Image compression failed", error);
      setErrorMessage("图片处理失败，请尝试其他图片");
      setStatus("");
    }
  }, []);

  const handleGenerate = async () => {
    const uploadFile =
      shouldUseOriginalUpload(selectedTemplate) && originalFile
        ? originalFile
        : file;

    if (!uploadFile) {
      debug.warn("No file selected for upload");
      return;
    }

    debug.log("Generate request started", {
      template: selectedTemplate,
      fileName: uploadFile.name,
      fileSize: uploadFile.size,
      fileSizeMB: (uploadFile.size / 1024 / 1024).toFixed(2),
      isOriginal: shouldUseOriginalUpload(selectedTemplate) && !!originalFile,
      mimeType: uploadFile.type,
    });

    setLoading(true);
    setStatus("上传中...");
    setErrorMessage("");

    try {
      const formData = new FormData();
      formData.append("image", uploadFile);
      formData.append("template", selectedTemplate);
      formData.append(ACCESS_PASSWORD_FIELD, accessPassword);

      debug.log("FormData prepared", {
        hasImage: formData.has("image"),
        hasTemplate: formData.has("template"),
        hasPassword: formData.has(ACCESS_PASSWORD_FIELD),
      });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 180000); // 3分钟超时
      const requestStartTime = Date.now();

      const response = await fetch("/api/generate", {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const requestDuration = Date.now() - requestStartTime;

      debug.log("Generate response received", {
        status: response.status,
        statusText: response.statusText,
        durationMs: requestDuration,
        headers: {
          contentType: response.headers.get("content-type"),
        },
      });

      setStatus("生成中...");

      let data;
      try {
        data = await response.json();
        debug.log("Response JSON parsed", { success: data.success, hasImageUrl: !!data.imageUrl, version: data.version });
      } catch (parseError) {
        debug.error("Failed to parse response JSON", parseError);
        throw new Error("服务器响应格式错误");
      }

      // 版本检查：如果服务器版本与客户端版本不同，刷新页面
      if (data.version && data.version !== serverVersion && serverVersion) {
        debug.warn("Server version mismatch, reloading page", {
          oldVersion: serverVersion,
          newVersion: data.version,
        });
        setServerVersion(data.version);
        // 等待1秒再刷新，让用户看到提示
        setTimeout(() => {
          window.location.reload();
        }, 1000);
        throw new Error("检测到新版本，正在重新加载...");
      }

      if (data.version) {
        setServerVersion(data.version);
      }

      if (response.status === 401) {
        debug.warn("Unauthorized response, clearing session");
        localStorage.removeItem(ACCESS_PASSWORD_STORAGE_KEY);
        setIsUnlocked(false);
        setAccessPassword("");
      }

      if (!response.ok || !data.success) {
        const errorMsg = data.error || "生成失败，请重试";
        debug.error("Generate API returned error", {
          status: response.status,
          error: errorMsg,
          data,
        });
        throw new Error(errorMsg);
      }

      debug.log("Generate successful", {
        imageUrl: data.imageUrl ? "received" : "missing",
        totalDuration: requestDuration,
      });

      setGeneratedImage(data.imageUrl);
      setStatus("");
    } catch (error) {
      debug.error("Generate request failed", {
        error: error instanceof Error ? error.message : String(error),
        errorName: error instanceof Error ? error.name : "unknown",
        template: selectedTemplate,
      });
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
          <h1 className="text-3xl font-bold text-gray-900">电商AI助手</h1>

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
              {shouldUseOriginalUpload(selectedTemplate) && originalFile && (
                <p className="text-sm text-gray-500">
                  当前模板将使用原图: {formatFileSize(originalFile.size)}
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
