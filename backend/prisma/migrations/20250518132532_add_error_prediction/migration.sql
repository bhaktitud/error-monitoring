-- CreateTable
CREATE TABLE "ErrorPrediction" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "groupId" TEXT,
    "probableCauses" JSONB NOT NULL DEFAULT '[]',
    "predictionTime" INTEGER NOT NULL,
    "modelVersion" TEXT NOT NULL DEFAULT '1.0.0',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ErrorPrediction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ErrorPrediction_eventId_idx" ON "ErrorPrediction"("eventId");

-- CreateIndex
CREATE INDEX "ErrorPrediction_groupId_idx" ON "ErrorPrediction"("groupId");

-- AddForeignKey
ALTER TABLE "ErrorPrediction" ADD CONSTRAINT "ErrorPrediction_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ErrorPrediction" ADD CONSTRAINT "ErrorPrediction_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "ErrorGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;
