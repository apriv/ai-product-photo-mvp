import "server-only";
import { prisma } from "@/lib/prisma";
import type { GenerationStatus } from "@/generated/prisma/enums";

export type GenerationLogEntry = {
  userId: string;
  feature: "image" | "video";
  template: string;
  model?: string | null;
  cost: number;
  status: GenerationStatus;
  errorMsg?: string | null;
  durationMs?: number | null;
};

export async function recordGeneration(entry: GenerationLogEntry) {
  try {
    return await prisma.generationLog.create({
      data: {
        userId: entry.userId,
        feature: entry.feature,
        template: entry.template,
        model: entry.model ?? null,
        cost: entry.cost,
        status: entry.status,
        errorMsg: entry.errorMsg ?? null,
        durationMs: entry.durationMs ?? null,
      },
    });
  } catch {
    // Logging failures must not break generation — swallow.
    return null;
  }
}
