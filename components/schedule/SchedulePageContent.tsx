'use client'

import { useState, useCallback } from 'react'
import TravelScheduleTable from '@/components/schedule/TravelScheduleTable'
import ScheduleSidebar from '@/components/schedule/ScheduleSidebar'
import { CollapsibleSection } from '@/components/ui'

export default function SchedulePageContent() {
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [scheduleRefreshKey, setScheduleRefreshKey] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const onScheduleChange = useCallback(() => {
    setScheduleRefreshKey((k) => k + 1)
  }, [])

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* 모바일: 캘린더(1,펼침) → 검색(2,접힘) → 일정등록(3,접힘). 데스크톱: (검색+등록) | 캘린더 */}
      <div className="contents lg:!flex lg:flex-1 lg:flex-col lg:min-w-0 lg:gap-4">
        <div className="order-2 lg:order-none">
          <CollapsibleSection title="검색" compactDesktop defaultOpen={false}>
            <div className="p-2 md:p-0">
              <input
                id="schedule-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="제목·내용 검색"
                className="w-full px-2 py-1 text-sm border border-slate-300 rounded bg-white focus:ring-1 focus:ring-blue-500 placeholder:text-slate-400 min-w-0 md:py-1.5 md:px-3 md:rounded-lg"
              />
            </div>
          </CollapsibleSection>
        </div>
        <div className="order-3 lg:order-none">
          <CollapsibleSection title="일정 등록" compactDesktop defaultOpen={false}>
            <div className="p-0">
              <TravelScheduleTable
                highlightDate={selectedDate}
                onScheduleChange={onScheduleChange}
                searchQuery={searchQuery}
              />
            </div>
          </CollapsibleSection>
        </div>
      </div>
      <div className="order-1 lg:order-2 lg:w-80 shrink-0">
        <CollapsibleSection title="캘린더" compactDesktop defaultOpen={true}>
          <div className="p-0">
            <ScheduleSidebar
              selectedDate={selectedDate}
              onSelectDate={(dateKey) => setSelectedDate(dateKey)}
              scheduleRefreshKey={scheduleRefreshKey}
              searchQuery={searchQuery}
            />
          </div>
        </CollapsibleSection>
      </div>
    </div>
  )
}
