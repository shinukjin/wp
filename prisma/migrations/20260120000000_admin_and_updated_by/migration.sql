-- AlterTable User: add approved, isAdmin
ALTER TABLE "User" ADD COLUMN "approved" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "isAdmin" BOOLEAN NOT NULL DEFAULT false;

-- WeddingPrep: add updatedById
ALTER TABLE "WeddingPrep" ADD COLUMN "updatedById" TEXT;
ALTER TABLE "WeddingPrep" ADD CONSTRAINT "WeddingPrep_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- RealEstate: add updatedById
ALTER TABLE "RealEstate" ADD COLUMN "updatedById" TEXT;
ALTER TABLE "RealEstate" ADD CONSTRAINT "RealEstate_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- TravelSchedule: add updatedById
ALTER TABLE "TravelSchedule" ADD COLUMN "updatedById" TEXT;
ALTER TABLE "TravelSchedule" ADD CONSTRAINT "TravelSchedule_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 기존 사용자 승인 처리 (이미 가입된 사용자는 approved=true로)
UPDATE "User" SET "approved" = true WHERE "isDeleted" = false;
