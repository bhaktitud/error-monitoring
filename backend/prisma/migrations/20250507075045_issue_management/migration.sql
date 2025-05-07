/*
  Warnings:

  - Added the required column `updatedAt` to the `ErrorGroup` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ErrorGroup" ADD COLUMN     "assignedTo" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'open',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "ErrorGroupComment" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ErrorGroupComment_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ErrorGroup" ADD CONSTRAINT "ErrorGroup_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "ProjectMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ErrorGroupComment" ADD CONSTRAINT "ErrorGroupComment_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "ErrorGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ErrorGroupComment" ADD CONSTRAINT "ErrorGroupComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "ProjectMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
