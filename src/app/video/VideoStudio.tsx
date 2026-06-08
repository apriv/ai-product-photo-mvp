"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Badge, Button, Card, Textarea } from "@/components/ui";

type Task = {
  requestId: string;
  status: "IN_QUEUE" | "IN_PROGRESS" | "COMPLETED" | "FAILED";
  queuePosition?: number | null;
  templateId: string;
  templateName: string;
  cost: number;
  chargeRef: string;
  startedAt: number;
  videoUrl?: string;
};

const statusLabels = {
  IN_QUEUE: "排队中",
  IN_PROGRESS: "生成中",
  COMPLETED: "生成成功",
  FAILED: "生成失败",
};

export default function VideoStudio() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState<"9:16" | "16:9">("9:16");
  const [resolution, setResolution] = useState<"480p" | "720p">("480p");
  const [task, setTask] = useState<Task | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!task || task.status === "COMPLETED" || task.status === "FAILED") return;
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/video/tasks/${task.requestId}`, {
          cache: "no-store",
        });
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.error || "查询任务失败");
        setTask((current) => (current ? { ...current, ...data.task } : current));
      } catch (pollError) {
        setError(pollError instanceof Error ? pollError.message : "查询任务失败");
        setTask((current) => (current ? { ...current, status: "FAILED" } : current));
      }
    }, 3500);
    return () => window.clearTimeout(timer);
  }, [task]);

  function chooseFiles(nextFiles: FileList | null) {
    if (!nextFiles?.length) return;
    setError("");
    const selected = Array.from(nextFiles);
    if (files.length + selected.length > 4) {
      setError("最多上传 4 张图片");
      return;
    }
    if (selected.some((file) => !file.type.startsWith("image/") || file.size > 10 * 1024 * 1024)) {
      setError("请选择小于 10MB 的图片");
      return;
    }
    setFiles((current) => [...current, ...selected]);
    setPreviews((current) => [...current, ...selected.map(URL.createObjectURL)]);
    setTask(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function removeFile(index: number) {
    URL.revokeObjectURL(previews[index]);
    setFiles((current) => current.filter((_, itemIndex) => itemIndex !== index));
    setPreviews((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  async function submit() {
    if (!files.length || !prompt.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      const form = new FormData();
      files.forEach((file) => form.append("images", file));
      form.append("prompt", prompt);
      form.append("aspectRatio", aspectRatio);
      form.append("resolution", resolution);
      const response = await fetch("/api/video/tasks", { method: "POST", body: form });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "提交失败");
      setTask(data.task);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "提交失败");
    } finally {
      setSubmitting(false);
    }
  }

  const active = task && !["COMPLETED", "FAILED"].includes(task.status);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
      <div className="space-y-6">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">1. 上传商品图</h2>
            <span className="text-xs text-gray-500">最多 4 张 · 每张 10MB 内</span>
          </div>
          <button
            type="button"
            disabled={Boolean(active)}
            onClick={() => inputRef.current?.click()}
            className="mt-4 flex min-h-28 w-full items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 text-sm text-gray-500 transition hover:border-gray-500 disabled:cursor-not-allowed"
          >
            点击选择商品图片（可多选）
          </button>
          {previews.length > 0 && (
            <div className="mt-3 grid grid-cols-2 gap-3">
              {previews.map((preview, index) => (
                <div key={preview} className="relative aspect-square overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
              <Image
                src={preview}
                    alt={`商品图预览 ${index + 1}`}
                    fill
                unoptimized
                className="h-full w-full object-contain"
              />
                  {!active && <button type="button" onClick={() => removeFile(index)} className="absolute right-2 top-2 rounded bg-white/90 px-2 py-1 text-xs shadow">删除</button>}
                </div>
              ))}
            </div>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(event) => chooseFiles(event.target.files)}
          />
        </Card>

        <Card className="p-5">
          <h2 className="text-sm font-semibold">2. 视频设置</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <OptionButtons label="画面比例" value={aspectRatio} options={["9:16", "16:9"]} disabled={Boolean(active)} onChange={(value) => setAspectRatio(value as "9:16" | "16:9")} />
            <OptionButtons label="清晰度" value={resolution} options={["480p", "720p"]} disabled={Boolean(active)} onChange={(value) => setResolution(value as "480p" | "720p")} />
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-sm font-semibold">3. Prompt</h2>
          <Textarea
            className="mt-4 min-h-36"
            maxLength={1200}
            disabled={Boolean(active)}
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder="描述你想生成的视频内容、镜头运动和风格。"
          />
          <div className="mt-4 flex items-center justify-between gap-3">
            <span className="text-xs text-gray-500">{prompt.length}/1200</span>
            <Button disabled={!files.length || !prompt.trim() || submitting || Boolean(active)} onClick={submit}>
              {submitting ? "正在提交..." : task?.status === "FAILED" ? "重新生成" : "生成视频 · 80 积分"}
            </Button>
          </div>
        </Card>
      </div>

      <Card className="min-h-[560px] p-5 lg:sticky lg:top-20 lg:self-start">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold">生成结果</h2>
            <p className="mt-1 text-xs text-gray-500">任务在后台生成，可以清楚看到当前阶段。</p>
          </div>
          {task && <Badge tone={task.status === "COMPLETED" ? "success" : task.status === "FAILED" ? "danger" : "warning"}>{statusLabels[task.status]}</Badge>}
        </div>

        {error && <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

        {task?.status === "COMPLETED" && task.videoUrl ? (
          <div className="mt-5">
            <video src={task.videoUrl} controls playsInline className="aspect-video w-full rounded-lg bg-black object-contain" />
            <div className="mt-4 flex flex-wrap gap-2">
              <a href={task.videoUrl} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center rounded-lg bg-gray-950 px-4 text-sm font-medium text-white">打开视频</a>
              <Button tone="secondary" onClick={submit}>再生成一次</Button>
            </div>
            <p className="mt-3 text-xs text-gray-500">视频链接已保存到素材库记录。</p>
          </div>
        ) : task ? (
          <div className="mt-5 flex min-h-[430px] flex-col items-center justify-center rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-gray-300 border-t-gray-950" />
            <div className="mt-5 text-sm font-medium">{statusLabels[task.status]}</div>
            <p className="mt-2 max-w-sm text-sm leading-6 text-gray-500">
              {task.status === "IN_QUEUE"
                ? `任务已进入队列${task.queuePosition != null ? `，前方约 ${task.queuePosition} 个任务` : ""}。`
                : "模型正在生成视频，通常需要数分钟。你可以停留在此页查看进度。"}
            </p>
          </div>
        ) : (
          <div className="mt-5 flex min-h-[430px] items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
            <div>
              <div className="text-sm font-medium text-gray-700">视频预览将在这里出现</div>
              <p className="mt-2 max-w-sm text-sm leading-6 text-gray-500">上传商品图并填写 Prompt 后即可提交生成任务。</p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

function OptionButtons({ label, value, options, disabled, onChange }: { label: string; value: string; options: string[]; disabled: boolean; onChange: (value: string) => void }) {
  return (
    <div>
      <div className="text-xs text-gray-500">{label}</div>
      <div className="mt-2 flex gap-2">
        {options.map((option) => (
          <button key={option} type="button" disabled={disabled} onClick={() => onChange(option)} className={`h-10 flex-1 rounded-lg border text-sm font-medium transition disabled:cursor-not-allowed ${value === option ? "border-gray-950 bg-gray-950 text-white" : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"}`}>
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}
