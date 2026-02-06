'use client'

import Calendar from '@/components/calendar/Calendar'

interface ScheduleSidebarProps {
  selectedDate?: string | null
  onSelectDate?: (dateKey: string) => void
  scheduleRefreshKey?: number
  searchQuery?: string
  onLoaded?: () => void
}

export default function ScheduleSidebar({ selectedDate, onSelectDate, scheduleRefreshKey = 0, searchQuery = '', onLoaded }: ScheduleSidebarProps = {}) {
  return (
    <aside className="flex flex-col w-full">
      <Calendar selectedDate={selectedDate} onSelectDate={onSelectDate} refreshKey={scheduleRefreshKey} searchQuery={searchQuery} onLoaded={onLoaded} />
    </aside>
  )
}
