import Container from '@/components/layout/Container'
import SchedulePageContent from '@/components/schedule/SchedulePageContent'

export default function SchedulePage() {
  return (
    <Container maxWidth="full" className="py-8">
      <div className="mb-4">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
          일정계획
        </h1>
        <p className="mt-0.5 text-xs text-gray-500">
          캘린더에서 날짜를 누르면 해당 날짜의 일정이 테이블에 표시됩니다. 아래에 상세 내용이 나옵니다.
        </p>
      </div>

      <SchedulePageContent />
    </Container>
  )
}
