import "server-only";
import { prisma } from "@/lib/prisma";
import logger from "@/lib/logger";
import type { AssetType } from "@/generated/prisma/enums";

export type CreateAssetEntry = {
  userId: string;
  type: AssetType;
  title: string;
  sourceUrl: string;
  template?: string | null;
  model?: string | null;
  provider?: string | null;
  mimeType?: string | null;
  width?: number | null;
  height?: number | null;
  generationLogId?: string | null;
};

export async function createAsset(entry: CreateAssetEntry) {
  try {
    return await prisma.asset.create({
      data: {
        userId: entry.userId,
        type: entry.type,
        title: entry.title,
        sourceUrl: entry.sourceUrl,
        template: entry.template ?? null,
        model: entry.model ?? null,
        provider: entry.provider ?? null,
        mimeType: entry.mimeType ?? null,
        width: entry.width ?? null,
        height: entry.height ?? null,
        generationLogId: entry.generationLogId ?? null,
      },
    });
  } catch (error) {
    logger.error("asset create failed", {
      userId: entry.userId,
      type: entry.type,
      template: entry.template,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}
