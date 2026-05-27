export const COPY_GPT_MODEL = "gpt-4o-mini";

export const SEEDING_VIDEO_PROMPT_TEMPLATE = `You are a creative short-form ad script writer for ecommerce products.

Your task is to generate a 5-10 second product ad script in a TikTok / UGC style.

Input:
- Product title: {product_title}
- Optional product description: {product_description}
- Goal: create a short, catchy ad script that feels native to TikTok and is suitable for AI video generation.

Requirements:
- Output must be in English.
- The ad should be 5-10 seconds long.
- Style: UGC, fast hook, relatable, natural, social-media-native.
- Focus on one core benefit only.
- Make it visually easy to turn into a short product video.
- Avoid generic fluff.
- If product description is not provided, infer a reasonable but non-specific ecommerce use case from the product title only.

Please return:
1. Hook
2. Video concept (1 sentence)
3. Shot-by-shot script (3-5 short shots)
4. On-screen text
5. Voiceover
6. Final video generation prompt

The final video generation prompt should be one clean paragraph in English, describing the scene, action, camera style, mood, and product focus.`;

function replaceAll(template: string, values: Record<string, string>) {
  return Object.entries(values).reduce(
    (current, [key, value]) => current.replaceAll(`{${key}}`, value),
    template
  );
}

export function buildSeedingVideoPrompt({
  productTitle,
  productDescription,
}: {
  productTitle?: string;
  productDescription?: string;
}) {
  return replaceAll(SEEDING_VIDEO_PROMPT_TEMPLATE, {
    product_title: productTitle?.trim() || "Not provided",
    product_description: productDescription?.trim() || "Not provided",
  });
}
