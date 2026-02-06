-- User: 디스코드 웹훅 URL
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "discordWebhookUrl" TEXT;

-- ConnectionRequest
CREATE TABLE IF NOT EXISTS "ConnectionRequest" (
    "id" TEXT NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "toUserId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConnectionRequest_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ConnectionRequest_fromUserId_toUserId_key" ON "ConnectionRequest"("fromUserId", "toUserId");
CREATE INDEX IF NOT EXISTS "ConnectionRequest_toUserId_idx" ON "ConnectionRequest"("toUserId");
CREATE INDEX IF NOT EXISTS "ConnectionRequest_fromUserId_idx" ON "ConnectionRequest"("fromUserId");

ALTER TABLE "ConnectionRequest" ADD CONSTRAINT "ConnectionRequest_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ConnectionRequest" ADD CONSTRAINT "ConnectionRequest_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Connection
CREATE TABLE IF NOT EXISTS "Connection" (
    "id" TEXT NOT NULL,
    "userId1" TEXT NOT NULL,
    "userId2" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Connection_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Connection_userId1_userId2_key" ON "Connection"("userId1", "userId2");
CREATE INDEX IF NOT EXISTS "Connection_userId1_idx" ON "Connection"("userId1");
CREATE INDEX IF NOT EXISTS "Connection_userId2_idx" ON "Connection"("userId2");

ALTER TABLE "Connection" ADD CONSTRAINT "Connection_userId1_fkey" FOREIGN KEY ("userId1") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Connection" ADD CONSTRAINT "Connection_userId2_fkey" FOREIGN KEY ("userId2") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- TravelSchedule: 알림 전송 시각
ALTER TABLE "TravelSchedule" ADD COLUMN IF NOT EXISTS "reminderSentAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "TravelSchedule_reminder_idx" ON "TravelSchedule"("remindEnabled", "reminderSentAt", "dueDate");
