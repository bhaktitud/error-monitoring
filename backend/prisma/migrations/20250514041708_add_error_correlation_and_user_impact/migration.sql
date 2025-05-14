-- AlterTable
ALTER TABLE "ErrorGroup" ADD COLUMN     "userImpactLastDay" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "userImpactLastHour" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "userImpactLastWeek" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "ErrorSequence" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT,
    "fromErrorId" TEXT NOT NULL,
    "toErrorId" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sessionId" TEXT,
    "timeGap" INTEGER NOT NULL,

    CONSTRAINT "ErrorSequence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActiveUserCount" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "timeWindow" TEXT NOT NULL,
    "userCount" INTEGER NOT NULL,

    CONSTRAINT "ActiveUserCount_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ErrorSequence_projectId_userId_idx" ON "ErrorSequence"("projectId", "userId");

-- CreateIndex
CREATE INDEX "ErrorSequence_fromErrorId_toErrorId_idx" ON "ErrorSequence"("fromErrorId", "toErrorId");

-- CreateIndex
CREATE INDEX "ErrorSequence_occurredAt_idx" ON "ErrorSequence"("occurredAt");

-- CreateIndex
CREATE INDEX "ActiveUserCount_projectId_timeWindow_idx" ON "ActiveUserCount"("projectId", "timeWindow");

-- CreateIndex
CREATE UNIQUE INDEX "ActiveUserCount_projectId_timeWindow_timestamp_key" ON "ActiveUserCount"("projectId", "timeWindow", "timestamp");

-- AddForeignKey
ALTER TABLE "ErrorSequence" ADD CONSTRAINT "ErrorSequence_fromErrorId_fkey" FOREIGN KEY ("fromErrorId") REFERENCES "ErrorGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ErrorSequence" ADD CONSTRAINT "ErrorSequence_toErrorId_fkey" FOREIGN KEY ("toErrorId") REFERENCES "ErrorGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ErrorSequence" ADD CONSTRAINT "ErrorSequence_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActiveUserCount" ADD CONSTRAINT "ActiveUserCount_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
