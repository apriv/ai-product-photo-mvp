import { NextResponse } from "next/server";
import { fal } from "@fal-ai/client";

fal.config({
  credentials: process.env.FAL_KEY,
});

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

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const image = formData.get("image");
    const template = String(formData.get("template") || "抠图主图");

    if (!image || !(image instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          error: "没有收到图片文件",
        },
        { status: 400 }
      );
    }

    const imageUrl = await fal.storage.upload(image);

    // 抠图
    if (template === "抠图主图") {
      const result = await fal.subscribe("fal-ai/birefnet", {
        input: {
          image_url: imageUrl,
        },
      });

      return NextResponse.json({
        success: true,
        imageUrl: result.data.image.url,
      });
    }

    // 社媒海报
    if (template === "社媒海报") {
      const result = await fal.subscribe("fal-ai/flux-kontext/dev", {
        input: {
          image_url: imageUrl,
          prompt: getPosterPrompt(),
        },
      });

      return NextResponse.json({
        success: true,
        imageUrl: result.data.images[0].url,
      });
    }

    return NextResponse.json({
      success: false,
      error: "未知模板",
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: "生成失败",
      },
      { status: 500 }
    );
  }
}