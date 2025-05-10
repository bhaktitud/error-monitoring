-- DropForeignKey
ALTER TABLE "ErrorGroup" DROP CONSTRAINT "ErrorGroup_projectId_fkey";

-- DropForeignKey
ALTER TABLE "ErrorGroupComment" DROP CONSTRAINT "ErrorGroupComment_groupId_fkey";

-- DropForeignKey
ALTER TABLE "Event" DROP CONSTRAINT "Event_projectId_fkey";

-- DropForeignKey
ALTER TABLE "ProjectInvite" DROP CONSTRAINT "ProjectInvite_projectId_fkey";

-- DropForeignKey
ALTER TABLE "ProjectMember" DROP CONSTRAINT "ProjectMember_projectId_fkey";

-- DropForeignKey
ALTER TABLE "Webhook" DROP CONSTRAINT "Webhook_projectId_fkey";

-- DropForeignKey
ALTER TABLE "WebhookDelivery" DROP CONSTRAINT "WebhookDelivery_webhookId_fkey";

-- AddForeignKey
ALTER TABLE "ProjectMember" ADD CONSTRAINT "ProjectMember_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectInvite" ADD CONSTRAINT "ProjectInvite_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ErrorGroup" ADD CONSTRAINT "ErrorGroup_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ErrorGroupComment" ADD CONSTRAINT "ErrorGroupComment_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "ErrorGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Webhook" ADD CONSTRAINT "Webhook_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebhookDelivery" ADD CONSTRAINT "WebhookDelivery_webhookId_fkey" FOREIGN KEY ("webhookId") REFERENCES "Webhook"("id") ON DELETE CASCADE ON UPDATE CASCADE;
