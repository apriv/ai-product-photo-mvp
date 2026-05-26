-- CreateTable
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "template" TEXT,
    "model" TEXT,
    "sourceUrl" TEXT NOT NULL,
    "storage" TEXT NOT NULL DEFAULT 'PROVIDER',
    "provider" TEXT,
    "r2Key" TEXT,
    "r2Url" TEXT,
    "mimeType" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "generationLogId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Asset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Asset_userId_createdAt_idx" ON "Asset"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Asset_type_createdAt_idx" ON "Asset"("type", "createdAt");
