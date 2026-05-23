import { NextResponse } from "next/server";
import { fal } from "@fal-ai/client";
import sharp from "sharp";
import {
  getAccessPassword,
  validateAccessPassword,
} from "@/lib/access-control";
import logger from "@/lib/logger";

fal.config({
  credentials: process.env.FAL_KEY,
});

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function getPosterPrompt() {
  return `
Create a modern ecommerce social media poster using the uploaded product as the main subject.

Keep the exact product shape, color, logo, material, and details unchanged.

Add:
- premium gradient background
- soft studio lighting
- realistic shadow
- minimal abstract graphic elements
- clean Instagram style composition
- modern Xiaohongshu aesthetic
- professional commercial poster feeling

Do not add readable text, fake logos, watermarks, or extra products.

The product must stay centered and realistic.
`;
}

async function generatePlaceholder(): Promise<string> {
  // 生成一个 800x800 的白色背景 placeholder 图片，中间有文字
  const svg = `
    <svg width="800" height="800" xmlns="http://www.w3.org/2000/svg">
      <rect width="800" height="800" fill="white"/>
      <rect x="50" y="50" width="700" height="700" fill="none" stroke="#ddd" stroke-width="2" stroke-dasharray="10,5"/>
      <text x="400" y="380" font-family="Arial" font-size="32" fill="#999" text-anchor="middle">
        白底主图 (Placeholder)
      </text>
      <text x="400" y="440" font-family="Arial" font-size="16" fill="#bbb" text-anchor="middle">
        测试用 - 不消耗 Token
      </text>
      <text x="400" y="480" font-family="Arial" font-size="14" fill="#ddd" text-anchor="middle">
        生成时间: ${new Date().toLocaleString("zh-CN")}
      </text>
    </svg>
  `;

  const buffer = await sharp(Buffer.from(svg)).png().toBuffer();
  return `data:image/png;base64,${buffer.toString("base64")}`;
}

export async function POST(request: Request) {
  const startTime = Date.now();
  let template = "";
  let fileSizeMB = "";

  try {
    const formData = await request.formData();
    const access = validateAccessPassword(getAccessPassword(formData));

    if (!access.ok) {
      logger.warn("Generate request rejected by access control", {
        status: access.status,
      });
      return NextResponse.json(
        {
          success: false,
          error: access.error,
        },
        { status: access.status }
      );
    }

    const image = formData.get("image");
    template = String(formData.get("template") || "抠图主图");

    if (!image || !(image instanceof File)) {
      logger.warn("No image file received", { template });
      return NextResponse.json(
        {
          success: false,
          error: "没有收到图片文件",
        },
        { status: 400 }
      );
    }

    fileSizeMB = (image.size / 1024 / 1024).toFixed(2);

    // 文件大小检查
    if (image.size > MAX_FILE_SIZE) {
      logger.warn("File size exceeds limit", {
        template,
        fileName: image.name,
        fileSize: fileSizeMB,
        maxSize: "10MB",
      });
      return NextResponse.json(
        {
          success: false,
          error: `图片过大（${fileSizeMB}MB），限制 10MB`,
        },
        { status: 400 }
      );
    }

    logger.info("Image processing started", {
      template,
      fileName: image.name,
      fileSize: fileSizeMB,
      mimeType: image.type,
    });

    // 白底主图 - 测试 Placeholder (不调用 API)
    if (template === "白底主图") {
      try {
        logger.info("Generating placeholder image", { template });
        const placeholderUrl = await generatePlaceholder();
        logger.info("Placeholder generated successfully", {
          template,
          duration: `${Date.now() - startTime}ms`,
        });

        return NextResponse.json({
          success: true,
          imageUrl: placeholderUrl,
        });
      } catch (error) {
        logger.error("Placeholder generation failed", {
          template,
          error: error instanceof Error ? error.message : String(error),
        });
        throw new Error("生成 Placeholder 失败");
      }
    }

    let uploadUrl: string;
    try {
      uploadUrl = await fal.storage.upload(image);
      logger.info("Image uploaded to FAL storage", {
        template,
        uploadUrl: uploadUrl.substring(0, 50) + "...",
      });
    } catch (uploadError) {
      logger.error("FAL storage upload failed", {
        template,
        error:
          uploadError instanceof Error ? uploadError.message : String(uploadError),
      });
      throw new Error("图片上传失败，请检查网络连接");
    }

    // 抠图
    if (template === "抠图主图") {
      try {
        logger.info("Starting birefnet processing", { template });
        const result = await fal.subscribe("fal-ai/birefnet", {
          input: {
            image_url: uploadUrl,
          },
        });

        logger.info("Birefnet completed successfully", {
          template,
          duration: `${Date.now() - startTime}ms`,
        });

        return NextResponse.json({
          success: true,
          imageUrl: result.data.image.url,
        });
      } catch (modelError) {
        logger.error("Birefnet model failed", {
          template,
          error:
            modelError instanceof Error ? modelError.message : String(modelError),
          stack: modelError instanceof Error ? modelError.stack : undefined,
        });
        throw new Error("AI 模型处理失败，请重试");
      }
    }

    // 社媒海报
    if (template === "社媒海报") {
      try {
        logger.info("Starting flux-kontext processing", { template });
        const result = await fal.subscribe("fal-ai/flux-kontext/dev", {
          input: {
            image_url: uploadUrl,
            prompt: getPosterPrompt(),
          },
        });

        logger.info("Flux-kontext completed successfully", {
          template,
          duration: `${Date.now() - startTime}ms`,
        });

        return NextResponse.json({
          success: true,
          imageUrl: result.data.images[0].url,
        });
      } catch (modelError) {
        logger.error("Flux-kontext model failed", {
          template,
          error:
            modelError instanceof Error ? modelError.message : String(modelError),
          stack: modelError instanceof Error ? modelError.stack : undefined,
        });
        throw new Error("AI 模型处理超时，请重试");
      }
    }

    logger.warn("Unknown template", { template });
    return NextResponse.json(
      {
        success: false,
        error: "未知模板",
      },
      { status: 400 }
    );
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage =
      error instanceof Error ? error.message : "未知错误";
    const errorStack =
      error instanceof Error ? error.stack : undefined;

    logger.error("API error", {
      template,
      fileSizeMB,
      duration: `${duration}ms`,
      error: errorMessage,
      stack: errorStack,
    });

    return NextResponse.json(
      {
        success: false,
        error: errorMessage || "生成失败，请重试",
      },
      { status: 500 }
    );
  }
}
