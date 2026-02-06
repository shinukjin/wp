-- AlterTable TravelSchedule: add remindEnabled (알림 여부)
ALTER TABLE "TravelSchedule" ADD COLUMN IF NOT EXISTS "remindEnabled" BOOLEAN NOT NULL DEFAULT true;
