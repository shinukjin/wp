'use client'

import { cn } from '@/lib/utils/cn'

/** 페이지/테이블 로딩 시 균일한 높이로 표시 (새로고침 시 깜빡임·높이 튐 방지) */
export default function LoadingBlock({
  className,
  message = '로딩 중...',
}: {
  className?: string
  message?: string
}) {
  return (
    <div
      className={cn(
        'flex justify-center items-center min-h-[320px] text-gray-500 text-sm',
        className
      )}
      role="status"
      aria-live="polite"
    >
      {message}
    </div>
  )
}
