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

  return (
    <div className="flex flex-wrap gap-3 items-end">
      {/* 구분 필터 */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">구분</label>
        <select
          value={filters.category}
          onChange={(e) => handleFilterChange('category', e.target.value)}
          className="px-3 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">전체</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* 지역 필터 */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">지역</label>
        <input
          type="text"
          value={filters.region}
          onChange={(e) => handleFilterChange('region', e.target.value)}
          placeholder="지역 검색"
          className="w-32 px-3 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* 가격 범위 필터 */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">최소 가격</label>
        <input
          type="number"
          value={filters.minPrice}
          onChange={(e) => handleFilterChange('minPrice', e.target.value)}
          placeholder="0"
          min="0"
          className="w-32 px-3 py-1.5 text-xs border border-gray-300 rounded-md text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">최대 가격</label>
        <input
          type="number"
          value={filters.maxPrice}
          onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
          placeholder="0"
          min="0"
          className="w-32 px-3 py-1.5 text-xs border border-gray-300 rounded-md text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* 리셋 버튼 */}
      <button
        onClick={handleReset}
        className={cn(
          'px-3 py-1.5 text-xs font-medium rounded-md',
          'bg-gray-300 text-gray-700 hover:bg-gray-400',
          'transition-colors'
        )}
      >
        초기화
      </button>
    </div>
  )
}
