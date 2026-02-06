'use client'

import { cn } from '@/lib/utils/cn'

interface Filters {
  category: string
  status: string
  minAmount: string
  maxAmount: string
}

interface WeddingPrepFiltersProps {
  filters: Filters
  setFilters: (filters: Filters) => void
  categories: string[]
}

export default function WeddingPrepFilters({
  filters,
  setFilters,
  categories,
}: WeddingPrepFiltersProps) {
  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters({ ...filters, [key]: value })
  }

  const handleReset = () => {
    setFilters({
      category: '',
      status: '',
      minAmount: '',
      maxAmount: '',
    })
  }

  const inputClass = 'px-2 py-1 text-xs md:py-1.5 md:text-sm border border-gray-300 rounded w-full sm:w-20 md:w-24 min-w-0 focus:outline-none focus:ring-1 focus:ring-blue-500'
  const selectClass = 'px-2 py-1 text-xs md:py-1.5 md:text-sm border border-gray-300 rounded w-full sm:w-auto min-w-0 focus:outline-none focus:ring-1 focus:ring-blue-500'

  return (
    <div className="flex flex-wrap items-center gap-1.5 md:gap-2">
      <select
        value={filters.category}
        onChange={(e) => handleFilterChange('category', e.target.value)}
        className={selectClass}
        aria-label="구분"
      >
        <option value="">구분 전체</option>
        {categories.map((category) => (
          <option key={category} value={category}>
            {category}
          </option>
        ))}
      </select>
      <select
        value={filters.status}
        onChange={(e) => handleFilterChange('status', e.target.value)}
        className={selectClass}
        aria-label="상태"
      >
        <option value="">상태 전체</option>
        <option value="진행중">진행중</option>
        <option value="완료">완료</option>
        <option value="취소">취소</option>
      </select>
      <input
        type="number"
        value={filters.minAmount}
        onChange={(e) => handleFilterChange('minAmount', e.target.value)}
        placeholder="최소금액"
        className={cn(inputClass, 'text-right')}
        aria-label="최소 금액"
      />
      <span className="text-gray-400 text-xs hidden sm:inline">~</span>
      <input
        type="number"
        value={filters.maxAmount}
        onChange={(e) => handleFilterChange('maxAmount', e.target.value)}
        placeholder="최대금액"
        className={cn(inputClass, 'text-right')}
        aria-label="최대 금액"
      />
      <button
        onClick={handleReset}
        className={cn(
          'px-2 py-1 text-[11px] md:py-1.5 md:text-xs font-medium rounded',
          'bg-gray-200 text-gray-700 hover:bg-gray-300',
          'transition-colors touch-manipulation'
        )}
      >
        초기화
      </button>
    </div>
  )
}
