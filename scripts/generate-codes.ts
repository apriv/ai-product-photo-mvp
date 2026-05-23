import "dotenv/config";
import { config as loadDotenv } from "dotenv";
loadDotenv({ path: ".env.local", override: false });

import { randomBytes } from "node:crypto";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";

function parseArg(name: string) {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx === -1 || idx === process.argv.length - 1) return undefined;
  return process.argv[idx + 1];
}

// Crockford-style alphabet: no 0/O/1/I/L/U — safe to read aloud and type.
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTVWXYZ";

function randomSegment(len: number) {
  const bytes = randomBytes(len);
  let out = "";
  for (let i = 0; i < len; i++) {
    out += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return out;
}

async function main() {
  const planId = parseArg("plan");
  const countRaw = parseArg("count") ?? "1";
  const note = parseArg("note");

  if (!planId) {
    console.error("usage: tsx scripts/generate-codes.ts --plan <PLAN_ID> [--count N] [--note TEXT]");
    console.error("       tsx scripts/generate-codes.ts --plan STD --count 10");
    process.exit(1);
  }

  const count = Number.parseInt(countRaw, 10);
  if (!Number.isFinite(count) || count <= 0 || count > 1000) {
    throw new Error("count must be between 1 and 1000");
  }

  const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });

  try {
    const plan = await prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) throw new Error(`plan "${planId}" not found`);

    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      // Format: <PLAN>-<12 random chars>, e.g. STD-7K3M9XQP2VWN
      const code = `${plan.id}-${randomSegment(12)}`;
      await prisma.activationCode.create({
        data: { code, planId: plan.id, note: note ?? null },
      });
      codes.push(code);
    }

    console.log(`generated ${codes.length} codes for plan ${plan.id} (${plan.name}):`);
    for (const c of codes) console.log(c);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(`error: ${e.message}`);
  process.exit(1);
});
