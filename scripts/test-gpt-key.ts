import "dotenv/config";
import { config as loadDotenv } from "dotenv";
loadDotenv({ path: ".env.local", override: false });

const apiKey = process.env.GPT_KEY?.trim();

function maskKey(key: string) {
  if (key.length <= 12) return `${key.slice(0, 3)}...`;
  return `${key.slice(0, 7)}...${key.slice(-4)}`;
}

async function main() {
  if (!apiKey) {
    throw new Error("GPT_KEY is missing. Add GPT_KEY=sk-... to .env.local");
  }

  if (!apiKey.startsWith("sk-")) {
    throw new Error(`GPT_KEY has an unexpected format: ${maskKey(apiKey)}`);
  }

  console.log(`checking GPT_KEY ${maskKey(apiKey)}...`);

  const response = await fetch("https://api.openai.com/v1/models", {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API rejected the key (${response.status} ${response.statusText}): ${errorText}`);
  }

  const data = (await response.json()) as { data?: Array<{ id?: string }> };
  const sampleModels = data.data?.slice(0, 5).map((model) => model.id).filter(Boolean) ?? [];

  console.log("GPT_KEY works.");
  if (sampleModels.length > 0) {
    console.log(`visible models: ${sampleModels.join(", ")}`);
  }
}

main().catch((error) => {
  console.error(`error: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
