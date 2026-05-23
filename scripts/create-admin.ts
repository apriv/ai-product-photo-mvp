import "dotenv/config";
import { config as loadDotenv } from "dotenv";
loadDotenv({ path: ".env.local", override: false });

import bcrypt from "bcryptjs";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";

function parseArg(name: string) {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx === -1 || idx === process.argv.length - 1) return undefined;
  return process.argv[idx + 1];
}

async function readLine(promptText: string): Promise<string> {
  process.stdout.write(promptText);
  return new Promise((resolve, reject) => {
    let buf = "";
    const onData = (chunk: Buffer) => {
      buf += chunk.toString("utf8");
      const newlineIdx = buf.indexOf("\n");
      if (newlineIdx !== -1) {
        const line = buf.slice(0, newlineIdx).replace(/\r$/, "");
        process.stdin.off("data", onData);
        process.stdin.off("error", onError);
        process.stdin.off("end", onEnd);
        process.stdin.pause();
        resolve(line);
      }
    };
    const onError = (err: Error) => reject(err);
    const onEnd = () => {
      const line = buf.replace(/\r?\n?$/, "");
      resolve(line);
    };
    process.stdin.resume();
    process.stdin.on("data", onData);
    process.stdin.once("error", onError);
    process.stdin.once("end", onEnd);
  });
}

async function main() {
  const username = (parseArg("username") ?? (await readLine("admin username: "))).trim();
  if (!username) throw new Error("username required");

  const password = parseArg("password") ?? (await readLine("admin password: "));
  if (!password || password.length < 6) {
    throw new Error("password must be at least 6 chars");
  }

  const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });

  try {
    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
      throw new Error(`user "${username}" already exists`);
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        username,
        passwordHash,
        role: "ADMIN",
        wallet: { create: {} },
      },
    });

    console.log(`created admin: ${user.username} (id=${user.id})`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(`error: ${e.message}`);
  process.exit(1);
});
