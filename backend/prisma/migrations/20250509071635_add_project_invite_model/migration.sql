/*
  Warnings:

  - You are about to drop the `ProjectInvitation` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ProjectInvitation" DROP CONSTRAINT "ProjectInvitation_invitedById_fkey";

-- DropForeignKey
ALTER TABLE "ProjectInvitation" DROP CONSTRAINT "ProjectInvitation_invitedUserId_fkey";

-- DropForeignKey
ALTER TABLE "ProjectInvitation" DROP CONSTRAINT "ProjectInvitation_projectId_fkey";

-- DropTable
DROP TABLE "ProjectInvitation";

-- CreateTable
CREATE TABLE "ProjectInvite" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "invitedBy" TEXT NOT NULL,

    CONSTRAINT "ProjectInvite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProjectInvite_token_key" ON "ProjectInvite"("token");

-- CreateIndex
CREATE INDEX "ProjectInvite_token_idx" ON "ProjectInvite"("token");

-- CreateIndex
CREATE INDEX "ProjectInvite_email_projectId_idx" ON "ProjectInvite"("email", "projectId");

-- AddForeignKey
ALTER TABLE "ProjectInvite" ADD CONSTRAINT "ProjectInvite_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectInvite" ADD CONSTRAINT "ProjectInvite_invitedBy_fkey" FOREIGN KEY ("invitedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
