export const imageModels = {
  poster: "xai/grok-imagine-image/edit",
  backgroundRemoval: "fal-ai/birefnet",
} as const;

export const imagePrompts = {
  poster: `
Create a premium Instagram-style ecommerce poster image using the uploaded product as the main subject. Keep the product completely realistic and unchanged, preserving the exact shape, colors, logo, material, and details.

The background must fill the entire image edge-to-edge with a rich commercial scene, texture, lighting, reflections, surface, props, or environment. Do not create plain empty space, blank walls, large flat areas, or obvious placeholder whitespace.

Compose the product as a clear hero subject but do not let it occupy the whole frame. 

Use cinematic soft lighting, realistic shadows, elegant composition, and premium ecommerce styling. Do not generate any text, letters, numbers, fake logos, captions, watermarks, labels, or gibberish. Avoid clutter, distorted objects, oversaturated colors, or cheap AI-generated aesthetics. The final result should look like a real high-end commercial social media advertisement.`,

  listingBoard: `
Create a professional ecommerce listing board on a pure white background using the uploaded product. Place the main hero product image large in the center, surrounded by smaller multi-angle views and close-up detail shots showing texture, materials, buttons, packaging, or important features. Keep the product completely consistent and realistic across all images, preserving the exact shape, colors, logo, proportions, and details. Arrange the images in a clean balanced commercial layout with soft shadows, proper spacing, and premium studio lighting. The final result should look like a professionally designed Amazon or Shopify product listing preview board.
`,
} as const;

