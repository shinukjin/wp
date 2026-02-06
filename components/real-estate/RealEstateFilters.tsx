'use client'

import { cn } from '@/lib/utils/cn'

interface Filters {
  category: string
  region: string
  minPrice: string
  maxPrice: string
}

interface RealEstateFiltersProps {
  filters: Filters
  setFilters: (filters: Filters) => void
  categories: string[]
  regions: string[]
}

export default function RealEstateFilters({
  filters,
  setFilters,
  categories,
  regions,
}: RealEstateFiltersProps) {
  const handleFilterChange = (field: keyof Filters, value: string) => {
    setFilters({ ...filters, [field]: value })
  }

  const handleReset = () => {
    setFilters({
      category: '',
      region: '',
      minPrice: '',
      maxPrice: '',
    })
  }

  const inputClass = 'w-full sm:w-20 md:w-24 px-2 py-1 text-xs md:py-1.5 md:text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 min-w-0 text-right'

  return (
    <div className="flex flex-wrap items-center gap-1.5 md:gap-2">
      <select
        value={filters.category}
        onChange={(e) => handleFilterChange('category', e.target.value)}
        className="px-2 py-1 text-xs md:py-1.5 md:text-sm border border-gray-300 rounded w-full sm:w-auto min-w-0 focus:outline-none focus:ring-1 focus:ring-blue-500"
        aria-label="구분"
      >
        <option value="">구분 전체</option>
        {categories.map((cat) => (
          <option key={cat} value={cat}>
            {cat}
          </option>
        ))}
      </select>
      <input
        type="text"
        value={filters.region}
        onChange={(e) => handleFilterChange('region', e.target.value)}
        placeholder="지역"
        className="px-2 py-1 text-xs md:py-1.5 md:text-sm border border-gray-300 rounded w-full sm:w-20 md:w-24 min-w-0 focus:outline-none focus:ring-1 focus:ring-blue-500"
        aria-label="지역"
      />
      <input
        type="number"
        value={filters.minPrice}
        onChange={(e) => handleFilterChange('minPrice', e.target.value)}
        placeholder="최소가격"
        min="0"
        className={inputClass}
        aria-label="최소 가격"
      />
      <span className="text-gray-400 text-xs hidden sm:inline">~</span>
      <input
        type="number"
        value={filters.maxPrice}
        onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
        placeholder="최대가격"
        min="0"
        className={inputClass}
        aria-label="최대 가격"
      />
      <button
        onClick={handleReset}
        className={cn(
          'px-2 py-1 text-[11px] md:py-1.5 md:text-xs font-medium rounded',
          'bg-gray-300 text-gray-700 hover:bg-gray-400',
          'transition-colors touch-manipulation'
        )}
      >
        초기화
      </button>
    </div>
  )
}
