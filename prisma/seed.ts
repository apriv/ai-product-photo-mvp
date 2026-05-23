import "dotenv/config";
import { config as loadDotenv } from "dotenv";
loadDotenv({ path: ".env.local", override: false });

import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.plan.upsert({
    where: { id: "STD" },
    update: {},
    create: {
      id: "STD",
      name: "标准月卡",
      monthlyCredits: 500,
      kind: "MONTHLY",
    },
  });

  await prisma.plan.upsert({
    where: { id: "TOPUP-100" },
    update: {},
    create: {
      id: "TOPUP-100",
      name: "补充包 100",
      topupCredits: 100,
      kind: "TOPUP",
    },
  });

  console.log("seed: plans ready");

  const plans = await prisma.plan.findMany();
  console.log(plans);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
