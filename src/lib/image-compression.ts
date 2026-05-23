const TARGET_SIZE = 2 * 1024 * 1024; // 2MB target after compression
const MAX_IMAGE_EDGE = 4096;
const MIN_JPEG_QUALITY = 0.55;
const INITIAL_JPEG_QUALITY = 0.9;
const QUALITY_STEP = 0.08;

export type CompressionInfo = {
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

export function formatFileSize(bytes: number) {
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

export async function compressImage(file: File): Promise<CompressionResult> {
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

  let bestBlob: Blob | null = null;
  const size = calculateSize(
    image.naturalWidth,
    image.naturalHeight,
    MAX_IMAGE_EDGE
  );
  const finalWidth = size.width;
  const finalHeight = size.height;

  canvas.width = finalWidth;
  canvas.height = finalHeight;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, finalWidth, finalHeight);
  ctx.drawImage(image, 0, 0, finalWidth, finalHeight);

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
