-- TravelSchedule: 전날/당일 오전 9시 알림용 필드
ALTER TABLE "TravelSchedule" ADD COLUMN IF NOT EXISTS "reminderSentDayBefore" TIMESTAMP(3);
ALTER TABLE "TravelSchedule" ADD COLUMN IF NOT EXISTS "reminderSentDayOf" TIMESTAMP(3);
-- 기존 reminderSentAt 컬럼 제거 (선택적 - 있으면 제거)
ALTER TABLE "TravelSchedule" DROP COLUMN IF EXISTS "reminderSentAt";
