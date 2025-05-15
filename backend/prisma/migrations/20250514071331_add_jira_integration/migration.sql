-- CreateTable
CREATE TABLE "JiraIntegration" (
    "id" TEXT NOT NULL,
    "jiraIssueKey" TEXT NOT NULL,
    "jiraIssueUrl" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "errorId" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JiraIntegration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "JiraIntegration_groupId_idx" ON "JiraIntegration"("groupId");

-- CreateIndex
CREATE INDEX "JiraIntegration_createdById_idx" ON "JiraIntegration"("createdById");

-- AddForeignKey
ALTER TABLE "JiraIntegration" ADD CONSTRAINT "JiraIntegration_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "ProjectMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JiraIntegration" ADD CONSTRAINT "JiraIntegration_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "ErrorGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
