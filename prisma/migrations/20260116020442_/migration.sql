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

-- CreateIndex
CREATE INDEX "WeddingPrep_userId_idx" ON "WeddingPrep"("userId");

-- CreateIndex
CREATE INDEX "WeddingPrep_category_idx" ON "WeddingPrep"("category");

-- CreateIndex
CREATE INDEX "WeddingPrep_status_idx" ON "WeddingPrep"("status");

-- AddForeignKey
ALTER TABLE "WeddingPrep" ADD CONSTRAINT "WeddingPrep_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
