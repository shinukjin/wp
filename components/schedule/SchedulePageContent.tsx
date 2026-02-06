'use client'

import { useState, useCallback } from 'react'
import TravelScheduleTable from '@/components/schedule/TravelScheduleTable'
import ScheduleSidebar from '@/components/schedule/ScheduleSidebar'

export default function SchedulePageContent() {
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [scheduleRefreshKey, setScheduleRefreshKey] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const onScheduleChange = useCallback(() => {
    setScheduleRefreshKey((k) => k + 1)
  }, [])

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="flex-1 min-w-0">
        <div className="mb-3 flex items-center gap-2">
          <label htmlFor="schedule-search" className="text-xs font-medium text-slate-600 shrink-0">
            검색
          </label>
          <input
            id="schedule-search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="제목, 내용으로 검색"
            className="flex-1 max-w-xs px-3 py-1.5 text-sm border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-slate-400"
          />
        </div>
        <TravelScheduleTable
          highlightDate={selectedDate}
          onScheduleChange={onScheduleChange}
          searchQuery={searchQuery}
        />
      </div>
      <div className="lg:w-80 shrink-0">
        <ScheduleSidebar
          selectedDate={selectedDate}
          onSelectDate={(dateKey) => setSelectedDate(dateKey)}
          scheduleRefreshKey={scheduleRefreshKey}
          searchQuery={searchQuery}
        />
      </div>
    </div>
  )
}
