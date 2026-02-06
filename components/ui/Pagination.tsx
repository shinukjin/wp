'use client'

import { cn } from '@/lib/utils/cn'

export interface PaginationProps {
  /** 현재 페이지 (1부터 시작) */
  currentPage: number
  /** 전체 페이지 수 */
  totalPages: number
  /** 페이지 변경 시 호출 (1-based) */
  onPageChange: (page: number) => void
  /** 한 페이지당 항목 수 (선택, "1-10 / 50건" 표시용) */
  pageSize?: number
  /** 전체 항목 수 (선택, totalPages 대신 사용 가능. pageSize와 함께 사용) */
  totalItems?: number
  /** 한 번에 보여줄 페이지 버튼 개수 (기본 5) */
  maxVisiblePages?: number
  /** 추가 클래스 */
  className?: string
  /** 총 건수 문구 숨김 */
  hideTotal?: boolean
}

/**
 * 재사용 페이지네이션 컴포넌트.
 * 다른 목록(결혼준비, 부동산 등)에서도 동일하게 사용 가능.
 */
export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  pageSize,
  totalItems,
  maxVisiblePages = 5,
  className,
  hideTotal = false,
}: PaginationProps) {
  if (totalPages <= 0) return null

  const startItem = totalItems != null && pageSize != null ? (currentPage - 1) * pageSize + 1 : null
  const endItem = totalItems != null && pageSize != null ? Math.min(currentPage * pageSize, totalItems) : null

  const half = Math.floor(maxVisiblePages / 2)
  let startPage = Math.max(1, currentPage - half)
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)
  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1)
  }

  const pages: (number | 'ellipsis')[] = []
  if (startPage > 1) {
    pages.push(1)
    if (startPage > 2) pages.push('ellipsis')
  }
  for (let p = startPage; p <= endPage; p++) pages.push(p)
  if (endPage < totalPages) {
    if (endPage < totalPages - 1) pages.push('ellipsis')
    pages.push(totalPages)
  }

  const btnBase = 'min-w-[28px] h-7 px-1.5 text-xs font-medium rounded border transition-colors inline-flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed'
  const btnDefault = 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
  const btnActive = 'border-blue-600 bg-blue-600 text-white hover:bg-blue-700'

  return (
    <div className={cn('flex flex-wrap items-center justify-between gap-2', className)}>
      {!hideTotal && totalItems != null && pageSize != null && (
        <p className="text-xs text-gray-500">
          {totalItems === 0 ? (
            '0건'
          ) : (
            <>
              <span className="font-medium text-gray-700">{startItem}-{endItem}</span>
              <span> / </span>
              <span className="font-medium text-gray-700">{totalItems.toLocaleString()}건</span>
            </>
          )}
        </p>
      )}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className={cn(btnBase, btnDefault)}
          aria-label="이전 페이지"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        {pages.map((p, i) =>
          p === 'ellipsis' ? (
            <span key={`e-${i}`} className="px-1 text-xs text-gray-400">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              className={cn(btnBase, p === currentPage ? btnActive : btnDefault)}
              aria-label={`${p}페이지`}
              aria-current={p === currentPage ? 'page' : undefined}
            >
              {p}
            </button>
          )
        )}
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className={cn(btnBase, btnDefault)}
          aria-label="다음 페이지"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  )
}
