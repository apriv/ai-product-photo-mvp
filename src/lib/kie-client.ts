import "server-only";

const KIE_API_URL = "https://api.kie.ai/api/v1/jobs";
const KIE_UPLOAD_URL = "https://kieai.redpandaai.co/api/file-stream-upload";

function apiKey() {
  const key = process.env.KIE_KEY;
  if (!key) throw new Error("KIE_KEY 未配置");
  return key;
}

async function kieFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      ...init?.headers,
    },
  });
  const data = (await response.json()) as T & { code?: number; msg?: string };
  if (!response.ok || (data.code != null && data.code !== 200)) {
    throw new Error(data.msg || `Kie API 请求失败 (${response.status})`);
  }
  return data;
}

export async function uploadKieFile(file: File) {
  const form = new FormData();
  form.append("file", file);
  form.append("uploadPath", "video-inputs");
  const result = await kieFetch<{
    data: { fileUrl?: string; downloadUrl?: string };
  }>(KIE_UPLOAD_URL, { method: "POST", body: form });
  const url = result.data.fileUrl || result.data.downloadUrl;
  if (!url) throw new Error("Kie 上传接口未返回图片链接");
  return url;
}

export async function createKieVideoTask(input: {
  prompt: string;
  imageUrls: string[];
  aspectRatio: "9:16" | "16:9";
  resolution: "480p" | "720p";
}) {
  const result = await kieFetch<{ data: { taskId: string } }>(
    `${KIE_API_URL}/createTask`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "bytedance/seedance-2",
        input: {
          prompt: input.prompt,
          reference_image_urls: input.imageUrls,
          resolution: input.resolution,
          aspect_ratio: input.aspectRatio,
          duration: 5,
          generate_audio: false,
          return_last_frame: false,
          web_search: false,
        },
      }),
    }
  );
  return result.data.taskId;
}

export async function getKieTask(taskId: string) {
  const result = await kieFetch<{
    data: {
      state: "waiting" | "queuing" | "generating" | "success" | "fail";
      resultJson?: string;
      failMsg?: string;
    };
  }>(`${KIE_API_URL}/recordInfo?taskId=${encodeURIComponent(taskId)}`);
  return result.data;
}
