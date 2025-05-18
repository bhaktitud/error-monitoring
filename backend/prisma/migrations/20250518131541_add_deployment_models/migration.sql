-- CreateTable
CREATE TABLE "RootCauseAnalysis" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "analyzedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "probableCauses" JSONB NOT NULL DEFAULT '[]',
    "recommendations" JSONB NOT NULL DEFAULT '[]',
    "relatedDeployments" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "stackFrames" JSONB NOT NULL DEFAULT '[]',
    "systemConditions" JSONB NOT NULL DEFAULT '{}',
    "relatedEvents" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" TEXT NOT NULL DEFAULT 'pending',
    "processingTime" INTEGER,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RootCauseAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Deployment" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "environment" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'success',
    "repository" TEXT,
    "branch" TEXT,
    "commitHash" TEXT,
    "commitMessage" TEXT,
    "authorName" TEXT,
    "authorEmail" TEXT,
    "changedFiles" JSONB,
    "errorCount" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "deployedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Deployment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ErrorDeploymentRelation" (
    "id" TEXT NOT NULL,
    "deploymentId" TEXT NOT NULL,
    "errorGroupId" TEXT NOT NULL,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ErrorDeploymentRelation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RootCauseAnalysis_eventId_key" ON "RootCauseAnalysis"("eventId");

-- CreateIndex
CREATE INDEX "RootCauseAnalysis_eventId_idx" ON "RootCauseAnalysis"("eventId");

-- CreateIndex
CREATE INDEX "RootCauseAnalysis_groupId_status_idx" ON "RootCauseAnalysis"("groupId", "status");

-- CreateIndex
CREATE INDEX "Deployment_projectId_environment_idx" ON "Deployment"("projectId", "environment");

-- CreateIndex
CREATE INDEX "Deployment_deployedAt_idx" ON "Deployment"("deployedAt");

-- CreateIndex
CREATE INDEX "Deployment_commitHash_idx" ON "Deployment"("commitHash");

-- CreateIndex
CREATE INDEX "ErrorDeploymentRelation_deploymentId_idx" ON "ErrorDeploymentRelation"("deploymentId");

-- CreateIndex
CREATE INDEX "ErrorDeploymentRelation_errorGroupId_idx" ON "ErrorDeploymentRelation"("errorGroupId");

-- CreateIndex
CREATE UNIQUE INDEX "ErrorDeploymentRelation_deploymentId_errorGroupId_key" ON "ErrorDeploymentRelation"("deploymentId", "errorGroupId");

-- AddForeignKey
ALTER TABLE "RootCauseAnalysis" ADD CONSTRAINT "RootCauseAnalysis_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RootCauseAnalysis" ADD CONSTRAINT "RootCauseAnalysis_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "ErrorGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deployment" ADD CONSTRAINT "Deployment_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ErrorDeploymentRelation" ADD CONSTRAINT "ErrorDeploymentRelation_deploymentId_fkey" FOREIGN KEY ("deploymentId") REFERENCES "Deployment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ErrorDeploymentRelation" ADD CONSTRAINT "ErrorDeploymentRelation_errorGroupId_fkey" FOREIGN KEY ("errorGroupId") REFERENCES "ErrorGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
