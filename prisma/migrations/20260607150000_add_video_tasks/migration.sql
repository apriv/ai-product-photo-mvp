CREATE TABLE "VideoTask" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "requestId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "template" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "cost" INTEGER NOT NULL,
    "chargeRef" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'IN_QUEUE',
    "sourceUrl" TEXT,
    "errorMsg" TEXT,
    "assetId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "completedAt" DATETIME,
    CONSTRAINT "VideoTask_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "VideoTask_requestId_key" ON "VideoTask"("requestId");
CREATE INDEX "VideoTask_userId_createdAt_idx" ON "VideoTask"("userId", "createdAt");
CREATE INDEX "VideoTask_userId_status_idx" ON "VideoTask"("userId", "status");
