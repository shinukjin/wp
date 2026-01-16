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

  return (
    <div className="flex flex-wrap gap-3 items-end">
      {/* 구분 필터 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">구분</label>
        <select
          value={filters.category}
          onChange={(e) => handleFilterChange('category', e.target.value)}
          className={cn(
            'px-3 py-2 text-sm border border-gray-300 rounded-md',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
          )}
        >
          <option value="">전체</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      {/* 상태 필터 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">상태</label>
        <select
          value={filters.status}
          onChange={(e) => handleFilterChange('status', e.target.value)}
          className={cn(
            'px-3 py-2 text-sm border border-gray-300 rounded-md',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
          )}
        >
          <option value="">전체</option>
          <option value="진행중">진행중</option>
          <option value="완료">완료</option>
          <option value="취소">취소</option>
        </select>
      </div>

      {/* 금액 범위 필터 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">최소 금액</label>
        <input
          type="number"
          value={filters.minAmount}
          onChange={(e) => handleFilterChange('minAmount', e.target.value)}
          placeholder="0"
          className={cn(
            'px-3 py-2 text-sm border border-gray-300 rounded-md w-32',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
          )}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">최대 금액</label>
        <input
          type="number"
          value={filters.maxAmount}
          onChange={(e) => handleFilterChange('maxAmount', e.target.value)}
          placeholder="무제한"
          className={cn(
            'px-3 py-2 text-sm border border-gray-300 rounded-md w-32',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
          )}
        />
      </div>

      {/* 초기화 버튼 */}
      <button
        onClick={handleReset}
        className={cn(
          'px-4 py-2 text-sm font-medium rounded-md',
          'bg-gray-200 text-gray-700 hover:bg-gray-300',
          'transition-colors'
        )}
      >
        초기화
      </button>
    </div>
  )
}
