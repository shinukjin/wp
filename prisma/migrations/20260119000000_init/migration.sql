-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "budget" INTEGER NOT NULL DEFAULT 0,
    "ownMoney" INTEGER NOT NULL DEFAULT 0,
    "loanAmount" INTEGER NOT NULL DEFAULT 0,
    "loanRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "loanPeriod" INTEGER NOT NULL DEFAULT 0,
    "discordWebhookUrl" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConnectionRequest" (
    "id" TEXT NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "toUserId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConnectionRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Connection" (
    "id" TEXT NOT NULL,
    "userId1" TEXT NOT NULL,
    "userId2" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Connection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeddingPrep" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "subCategory" TEXT,
    "content" TEXT NOT NULL,
    "amount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT '진행중',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "dueDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "note" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeddingPrep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RealEstate" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "rooms" INTEGER NOT NULL DEFAULT 0,
    "bathrooms" INTEGER NOT NULL DEFAULT 0,
    "price" INTEGER NOT NULL DEFAULT 0,
    "preference" INTEGER NOT NULL DEFAULT 1,
    "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "url" TEXT,
    "note" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RealEstate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TravelSchedule" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3),
    "note" TEXT,
    "remindEnabled" BOOLEAN NOT NULL DEFAULT true,
    "reminderSentDayBefore" TIMESTAMP(3),
    "reminderSentDayOf" TIMESTAMP(3),
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TravelSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "ConnectionRequest_toUserId_idx" ON "ConnectionRequest"("toUserId");

-- CreateIndex
CREATE INDEX "ConnectionRequest_fromUserId_idx" ON "ConnectionRequest"("fromUserId");

-- CreateIndex
CREATE UNIQUE INDEX "ConnectionRequest_fromUserId_toUserId_key" ON "ConnectionRequest"("fromUserId", "toUserId");

-- CreateIndex
CREATE INDEX "Connection_userId1_idx" ON "Connection"("userId1");

-- CreateIndex
CREATE INDEX "Connection_userId2_idx" ON "Connection"("userId2");

-- CreateIndex
CREATE UNIQUE INDEX "Connection_userId1_userId2_key" ON "Connection"("userId1", "userId2");

-- CreateIndex
CREATE INDEX "WeddingPrep_userId_idx" ON "WeddingPrep"("userId");

-- CreateIndex
CREATE INDEX "WeddingPrep_category_idx" ON "WeddingPrep"("category");

-- CreateIndex
CREATE INDEX "WeddingPrep_status_idx" ON "WeddingPrep"("status");

-- CreateIndex
CREATE INDEX "RealEstate_userId_idx" ON "RealEstate"("userId");

-- CreateIndex
CREATE INDEX "RealEstate_category_idx" ON "RealEstate"("category");

-- CreateIndex
CREATE INDEX "RealEstate_region_idx" ON "RealEstate"("region");

-- CreateIndex
CREATE INDEX "TravelSchedule_userId_idx" ON "TravelSchedule"("userId");

-- CreateIndex
CREATE INDEX "TravelSchedule_dueDate_idx" ON "TravelSchedule"("dueDate");

-- AddForeignKey
ALTER TABLE "ConnectionRequest" ADD CONSTRAINT "ConnectionRequest_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConnectionRequest" ADD CONSTRAINT "ConnectionRequest_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Connection" ADD CONSTRAINT "Connection_userId1_fkey" FOREIGN KEY ("userId1") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Connection" ADD CONSTRAINT "Connection_userId2_fkey" FOREIGN KEY ("userId2") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeddingPrep" ADD CONSTRAINT "WeddingPrep_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RealEstate" ADD CONSTRAINT "RealEstate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TravelSchedule" ADD CONSTRAINT "TravelSchedule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
