export const COPY_GEMINI_MODEL = "gemini-2.5-flash";

export const SEEDING_VIDEO_PROMPT_TEMPLATE = `You are a creative short-form ad script writer for ecommerce products.

Your task is to generate a 5-10 second product ad script in a TikTok / UGC style.

Input:
{input_lines}
- Goal: create a short, catchy ad script that feels native to TikTok and is suitable for AI video generation.

Requirements:
- Output must be in English.
- The ad should be 5-10 seconds long.
- Style: UGC, fast hook, relatable, natural, social-media-native.
- Focus on one core benefit only.
- Make it visually easy to turn into a short product video.
- Avoid generic fluff.
- Use any provided image as product and context evidence.
- If 1-2 inputs are missing, infer cautiously from the available title, description, or image. Do not mention missing inputs in the output.
- If all inputs are missing, create a broadly useful ecommerce script without inventing specific product claims.

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

function quoteInput(value: string | undefined, fallback: string) {
  const trimmed = value?.trim();
  return trimmed ? `"${trimmed}"` : fallback;
}

function buildPromptInputLines({
  productTitle,
  productDescription,
  hasProductImage,
}: {
  productTitle?: string;
  productDescription?: string;
  hasProductImage?: boolean;
}) {
  const titleLine = `- Product title: ${quoteInput(productTitle, "[Not provided by user]")}`;
  const descriptionLine = quoteInput(
    productDescription,
    hasProductImage
      ? "[Not provided by user, please infer from title/image]"
      : "[Not provided by user, please infer from title]"
  );
  const imageLine = hasProductImage
    ? "- Product image: [Provided as image input]"
    : null;

  return [
    titleLine,
    `- Product description: ${descriptionLine}`,
    imageLine,
  ].filter((line): line is string => Boolean(line));
}

export function buildSeedingVideoPrompt({
  productTitle,
  productDescription,
  hasProductImage,
}: {
  productTitle?: string;
  productDescription?: string;
  hasProductImage?: boolean;
}) {
  const inputLines = buildPromptInputLines({
    productTitle,
    productDescription,
    hasProductImage,
  }).join("\n");

  return replaceAll(SEEDING_VIDEO_PROMPT_TEMPLATE, {
    input_lines: inputLines,
  });
}
