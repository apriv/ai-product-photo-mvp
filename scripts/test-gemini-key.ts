import "dotenv/config";
import { config as loadDotenv } from "dotenv";
loadDotenv({ path: ".env.local", override: false });

const apiKey = process.env.GEMINI_KEY?.trim();

function maskKey(key: string) {
  if (key.length <= 12) return `${key.slice(0, 3)}...`;
  return `${key.slice(0, 7)}...${key.slice(-4)}`;
}

async function main() {
  if (!apiKey) {
    throw new Error("GEMINI_KEY is missing. Add GEMINI_KEY=... to .env.local");
  }

  console.log(`checking GEMINI_KEY ${maskKey(apiKey)}...`);

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API rejected the key (${response.status} ${response.statusText}): ${errorText}`);
  }

  const data = (await response.json()) as { models?: Array<{ name?: string }> };
  const sampleModels = data.models?.slice(0, 5).map((model) => model.name).filter(Boolean) ?? [];

  console.log("GEMINI_KEY works.");
  if (sampleModels.length > 0) {
    console.log(`visible models: ${sampleModels.join(", ")}`);
  }
}

main().catch((error) => {
  console.error(`error: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
