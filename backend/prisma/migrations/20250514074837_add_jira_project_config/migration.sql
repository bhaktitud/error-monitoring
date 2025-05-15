-- CreateTable
CREATE TABLE "JiraProjectConfig" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "baseUrl" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "apiToken" TEXT NOT NULL,
    "projectKey" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JiraProjectConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "JiraProjectConfig_projectId_key" ON "JiraProjectConfig"("projectId");

-- AddForeignKey
ALTER TABLE "JiraProjectConfig" ADD CONSTRAINT "JiraProjectConfig_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
