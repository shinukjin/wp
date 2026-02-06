'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils/cn'

interface CollapsibleSectionProps {
  title: string
  children: React.ReactNode
  /** 모바일에서 기본 펼침 여부 */
  defaultOpen?: boolean
  /** 데스크톱에서 카드 스타일 제거 (투명하게 표시) */
  compactDesktop?: boolean
  /** 카드 없이 헤더만 (자식이 이미 카드일 때) */
  minimal?: boolean
  /** 데스크톱에서는 접기 없이 항상 펼침 (md 이상) */
  className?: string
}

/** 모바일에서만 접기/펼치기. 데스크톱에서는 항상 펼침 */
export default function CollapsibleSection({
  title,
  children,
  defaultOpen = true,
  compactDesktop,
  minimal,
  className,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className={cn(
      !minimal && 'rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] shadow-sm overflow-hidden',
      minimal && 'rounded-xl overflow-hidden',
      compactDesktop && 'md:border-0 md:shadow-none md:bg-transparent md:rounded-none',
      minimal && 'md:rounded-none',
      className
    )}>
      {/* 모바일: 헤더 탭 시 토글. 데스크톱: 헤더 없이 내용만 */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'md:hidden w-full flex items-center justify-between px-3 py-2 text-left',
          minimal ? 'bg-[#eeedeb] border-b border-[var(--app-border)]' : 'bg-[#f0eeeb] border-b border-[var(--app-border)]',
          'active:opacity-90 transition-opacity touch-manipulation'
        )}
        aria-expanded={open}
      >
        <span className="text-xs font-semibold text-gray-900">{title}</span>
        <svg
          className={cn('w-4 h-4 text-gray-500 shrink-0 transition-transform', open && 'rotate-180')}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {/* 모바일: 접힐 때 숨김. 데스크톱: 항상 표시 */}
      <div className={cn('md:block', !open && 'hidden')}>
        {children}
      </div>
    </div>
  )
}
