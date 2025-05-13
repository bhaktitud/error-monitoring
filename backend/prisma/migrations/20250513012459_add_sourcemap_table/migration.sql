-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "browser" TEXT,
ADD COLUMN     "browserVersion" TEXT,
ADD COLUMN     "deviceType" TEXT,
ADD COLUMN     "environment" TEXT,
ADD COLUMN     "os" TEXT,
ADD COLUMN     "osVersion" TEXT,
ADD COLUMN     "release" TEXT;

-- CreateTable
CREATE TABLE "SourceMap" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "release" TEXT NOT NULL,
    "sourceFile" TEXT NOT NULL,
    "minifiedFile" TEXT,
    "sourceMap" JSONB NOT NULL,
    "originalFiles" TEXT[],
    "filename" TEXT NOT NULL,
    "fileSize" INTEGER,
    "contentType" TEXT,
    "uploadedBy" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "environment" TEXT,
    "buildNumber" TEXT,
    "gitCommit" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SourceMap_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SourceMap_projectId_release_idx" ON "SourceMap"("projectId", "release");

-- CreateIndex
CREATE INDEX "SourceMap_uploadedBy_idx" ON "SourceMap"("uploadedBy");

-- CreateIndex
CREATE INDEX "SourceMap_isActive_idx" ON "SourceMap"("isActive");

-- CreateIndex
CREATE INDEX "SourceMap_environment_release_idx" ON "SourceMap"("environment", "release");

-- CreateIndex
CREATE UNIQUE INDEX "SourceMap_projectId_release_sourceFile_key" ON "SourceMap"("projectId", "release", "sourceFile");

-- AddForeignKey
ALTER TABLE "SourceMap" ADD CONSTRAINT "SourceMap_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SourceMap" ADD CONSTRAINT "SourceMap_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
