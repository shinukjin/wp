-- CreateTable LoginLog (당일 접속량 등 통계용)
CREATE TABLE "LoginLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoginLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "LoginLog_userId_idx" ON "LoginLog"("userId");
CREATE INDEX "LoginLog_createdAt_idx" ON "LoginLog"("createdAt");

ALTER TABLE "LoginLog" ADD CONSTRAINT "LoginLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
