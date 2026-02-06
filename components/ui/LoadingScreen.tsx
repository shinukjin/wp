'use client'

import { cn } from '@/lib/utils/cn'

/**
 * 공통 로딩 화면 - 본문 영역 전체에 동일한 로딩 UI 표시
 * 레이아웃 하이드레이션 대기 및 각 페이지 데이터 로딩 시 사용
 */
export default function LoadingScreen({
  className,
  message = '로딩 중...',
}: {
  className?: string
  message?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col justify-center items-center gap-4 flex-1 min-h-[60vh] text-gray-500',
        className
      )}
      role="status"
      aria-live="polite"
    >
      <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm font-medium">{message}</p>
    </div>
  )
}
