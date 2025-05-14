-- CreateTable
CREATE TABLE "ProjectNotificationSettings" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "emailEnabled" BOOLEAN NOT NULL DEFAULT false,
    "slackEnabled" BOOLEAN NOT NULL DEFAULT false,
    "slackWebhookUrl" TEXT,
    "discordEnabled" BOOLEAN NOT NULL DEFAULT false,
    "discordWebhookUrl" TEXT,
    "telegramEnabled" BOOLEAN NOT NULL DEFAULT false,
    "telegramBotToken" TEXT,
    "telegramChatId" TEXT,
    "notifyOnNewError" BOOLEAN NOT NULL DEFAULT true,
    "notifyOnResolvedError" BOOLEAN NOT NULL DEFAULT false,
    "minimumErrorLevel" TEXT NOT NULL DEFAULT 'error',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectNotificationSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserNotificationPreferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emailEnabled" BOOLEAN NOT NULL DEFAULT true,
    "inAppEnabled" BOOLEAN NOT NULL DEFAULT true,
    "smsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserNotificationPreferences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProjectNotificationSettings_projectId_key" ON "ProjectNotificationSettings"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "UserNotificationPreferences_userId_key" ON "UserNotificationPreferences"("userId");

-- AddForeignKey
ALTER TABLE "ProjectNotificationSettings" ADD CONSTRAINT "ProjectNotificationSettings_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserNotificationPreferences" ADD CONSTRAINT "UserNotificationPreferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
