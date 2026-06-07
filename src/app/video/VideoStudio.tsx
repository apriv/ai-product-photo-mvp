"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Badge, Button, Card, Tabs, Textarea } from "@/components/ui";
import { videoTemplates } from "@/features/video/templates";

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
  const [templateId, setTemplateId] = useState(videoTemplates[0].id);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [script, setScript] = useState("");
  const [task, setTask] = useState<Task | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const selected = videoTemplates.find((item) => item.id === templateId)!;

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

  function chooseFile(nextFile?: File) {
    if (!nextFile) return;
    setError("");
    if (!nextFile.type.startsWith("image/") || nextFile.size > 10 * 1024 * 1024) {
      setError("请选择小于 10MB 的图片");
      return;
    }
    if (preview) URL.revokeObjectURL(preview);
    setFile(nextFile);
    setPreview(URL.createObjectURL(nextFile));
    setTask(null);
  }

  async function submit() {
    if (!file) return;
    setSubmitting(true);
    setError("");
    try {
      const form = new FormData();
      form.append("image", file);
      form.append("templateId", templateId);
      form.append("script", script);
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
            <span className="text-xs text-gray-500">JPG / PNG · 10MB 内</span>
          </div>
          <button
            type="button"
            disabled={Boolean(active)}
            onClick={() => inputRef.current?.click()}
            className="mt-4 flex aspect-[16/10] w-full items-center justify-center overflow-hidden rounded-lg border border-dashed border-gray-300 bg-gray-50 text-sm text-gray-500 transition hover:border-gray-500 disabled:cursor-not-allowed"
          >
            {preview ? (
              <Image
                src={preview}
                alt="商品图预览"
                width={800}
                height={500}
                unoptimized
                className="h-full w-full object-contain"
              />
            ) : (
              "点击选择商品图片"
            )}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => chooseFile(event.target.files?.[0])}
          />
        </Card>

        <Card className="p-5">
          <h2 className="text-sm font-semibold">2. 选择视频模板</h2>
          <Tabs
            className="mt-4"
            value={templateId}
            disabled={Boolean(active)}
            onChange={setTemplateId}
            items={videoTemplates.map((item) => ({
              value: item.id,
              label: item.name,
              description: item.desc,
              meta: `${item.cost} 积分`,
            }))}
          />
        </Card>

        <Card className="p-5">
          <h2 className="text-sm font-semibold">3. 补充脚本或创意方向</h2>
          <Textarea
            className="mt-4 min-h-36"
            maxLength={1200}
            disabled={Boolean(active)}
            value={script}
            onChange={(event) => setScript(event.target.value)}
            placeholder="例如：开场突出包装质感，中段缓慢展示产品细节，整体高级、克制。"
          />
          <div className="mt-4 flex items-center justify-between gap-3">
            <span className="text-xs text-gray-500">{script.length}/1200</span>
            <Button disabled={!file || submitting || Boolean(active)} onClick={submit}>
              {submitting ? "正在提交..." : task?.status === "FAILED" ? "重新生成" : `生成视频 · ${selected.cost} 积分`}
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
              <p className="mt-2 max-w-sm text-sm leading-6 text-gray-500">上传商品图、选择模板并填写脚本后即可提交长任务。</p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
