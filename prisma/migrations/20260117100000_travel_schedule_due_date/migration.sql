-- AlterTable TravelSchedule: startDate/endDate/destination -> dueDate
ALTER TABLE "TravelSchedule" ADD COLUMN IF NOT EXISTS "dueDate" TIMESTAMP(3);

-- Drop old index before dropping column
DROP INDEX IF EXISTS "TravelSchedule_startDate_idx";

-- Drop old columns
ALTER TABLE "TravelSchedule" DROP COLUMN IF EXISTS "destination";
ALTER TABLE "TravelSchedule" DROP COLUMN IF EXISTS "startDate";
ALTER TABLE "TravelSchedule" DROP COLUMN IF EXISTS "endDate";

-- Create index on dueDate
CREATE INDEX IF NOT EXISTS "TravelSchedule_dueDate_idx" ON "TravelSchedule"("dueDate");
