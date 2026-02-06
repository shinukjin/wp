'use client'

import { useEffect, useState } from 'react'
import apiClient from '@/lib/api/client'
import { useWeddingStore } from '@/lib/store/useWeddingStore'
import Link from 'next/link'

interface CalendarEvent {
  id: string
  category: string
  content: string
  amount: number
  status: string
  dueDate: string
  priority: number
}

interface TravelEvent {
  id: string
  title: string
  dueDate: string | null
  note: string | null
}

interface CalendarData {
  year: number
  month: number
  events: Record<string, CalendarEvent[]>
  travelByDate?: Record<string, TravelEvent[]>
}

interface CalendarProps {
  selectedDate?: string | null
  onSelectDate?: (dateKey: string) => void
  /** 상위에서 변경 시 캘린더 데이터 리프레시 (예: 일정 저장 후) */
  refreshKey?: number
  /** 검색어: 일정계획 제목·내용, 결혼준비 내용·구분 필터 (캘린더 숫자 반영) */
  searchQuery?: string
}

function matchSearchEvent(q: string, event: CalendarEvent): boolean {
  if (!q) return true
  return (
    event.content.toLowerCase().includes(q) ||
    (event.category ? event.category.toLowerCase().includes(q) : false)
  )
}

function matchSearchTravel(q: string, te: TravelEvent): boolean {
  if (!q) return true
  return (
    te.title.toLowerCase().includes(q) ||
    (te.note != null && te.note.toLowerCase().includes(q))
  )
}

export default function Calendar({ selectedDate: controlledSelected, onSelectDate, refreshKey = 0, searchQuery = '' }: CalendarProps = {}) {
  const { token } = useWeddingStore()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [calendarData, setCalendarData] = useState<CalendarData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [internalSelected, setInternalSelected] = useState<string | null>(null)
  const selectedDate = controlledSelected !== undefined ? controlledSelected : internalSelected
  const setSelectedDate = (key: string | null) => {
    if (onSelectDate && key) onSelectDate(key)
    if (controlledSelected === undefined) setInternalSelected(key)
  }

  useEffect(() => {
    if (token) {
      fetchCalendarData()
    }
  }, [token, currentDate, refreshKey])

  const fetchCalendarData = async () => {
    try {
      setLoading(true)
      setError(null)
      const year = currentDate.getFullYear()
      const month = currentDate.getMonth() + 1
      const response = await apiClient.get(`/calendar?year=${year}&month=${month}`)
      setCalendarData(response.data)
    } catch (err: any) {
      setError(err.response?.data?.error || '캘린더 데이터를 불러오는 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const formatDateKey = (year: number, month: number, day: number) => {
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  const isToday = (year: number, month: number, day: number) => {
    const today = new Date()
    return (
      year === today.getFullYear() &&
      month === today.getMonth() + 1 &&
      day === today.getDate()
    )
  }

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 2:
        return 'bg-gradient-to-r from-red-100 to-rose-100 text-red-800 border border-red-300 shadow-sm'
      case 1:
        return 'bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 border border-yellow-300 shadow-sm'
      default:
        return 'bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 border border-blue-300 shadow-sm'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case '완료':
        return 'bg-gradient-to-r from-green-500 to-emerald-500'
      case '진행중':
        return 'bg-gradient-to-r from-blue-500 to-cyan-500'
      case '취소':
        return 'bg-gradient-to-r from-gray-400 to-slate-400'
      default:
        return 'bg-gradient-to-r from-gray-400 to-slate-400'
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-gray-600">로딩 중...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
      </div>
    )
  }

  if (!calendarData) {
    return null
  }

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth() + 1
  const daysInMonth = getDaysInMonth(currentDate)
  const firstDay = getFirstDayOfMonth(currentDate)
  const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']
  const dayNames = ['일', '월', '화', '수', '목', '금', '토']

  const days = []
  // 빈 칸 추가 (첫 날 이전)
  for (let i = 0; i < firstDay; i++) {
    days.push(null)
  }
  // 날짜 추가
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day)
  }

  const searchTrim = (searchQuery || '').trim().toLowerCase()
  const selectedEvents =
    selectedDate && calendarData.events[selectedDate]
      ? searchTrim
        ? calendarData.events[selectedDate].filter((e) => matchSearchEvent(searchTrim, e))
        : calendarData.events[selectedDate]
      : []
  const selectedTravel =
    selectedDate && calendarData.travelByDate?.[selectedDate]
      ? searchTrim
        ? calendarData.travelByDate[selectedDate].filter((te) => matchSearchTravel(searchTrim, te))
        : calendarData.travelByDate[selectedDate]
      : []

  return (
    <div className="bg-white rounded-2xl shadow-lg p-5 border border-slate-200/60 overflow-hidden">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-slate-800">캘린더</h2>
        <div className="flex items-center gap-1">
          <button
            onClick={goToPreviousMonth}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={goToToday}
            className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            오늘
          </button>
          <button
            onClick={goToNextMonth}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      <div className="mb-3">
        <p className="text-sm font-medium text-slate-600">
          {year}년 {monthNames[month - 1]}
        </p>
      </div>

      <div className="grid grid-cols-7 gap-0.5 mb-2">
        {dayNames.map((day, i) => (
          <div
            key={day}
            className={`text-center text-xs font-medium py-1.5 ${i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-slate-500'}`}
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => {
          if (day === null) {
            return <div key={`empty-${index}`} className="aspect-square" />
          }

          const dateKey = formatDateKey(year, month, day)
          const rawEvents = calendarData.events[dateKey] || []
          const rawTravel = calendarData.travelByDate?.[dateKey] || []
          const events = searchTrim ? rawEvents.filter((e) => matchSearchEvent(searchTrim, e)) : rawEvents
          const travelOnDay = searchTrim ? rawTravel.filter((te) => matchSearchTravel(searchTrim, te)) : rawTravel
          const totalCount = events.length + travelOnDay.length
          const isCurrentDay = isToday(year, month, day)
          const isSelected = selectedDate === dateKey

          return (
            <div
              key={day}
              onClick={() => setSelectedDate(dateKey)}
              className={`relative aspect-square rounded-xl p-1 cursor-pointer transition-all duration-200 flex flex-col items-center justify-center border ${
                isSelected
                  ? 'bg-blue-500 text-white border-blue-500 shadow-md shadow-blue-200/50 scale-[1.02]'
                  : isCurrentDay
                  ? 'bg-slate-100 border-slate-300 text-slate-900 font-semibold'
                  : 'border-slate-200/80 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-800'
              }`}
              title={totalCount > 0 ? `알림 ${totalCount}건` : undefined}
            >
              {/* 1시 방향 알림 뱃지 */}
              {totalCount > 0 && (
                <span
                  className="absolute -top-1 -right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1.5 text-xs font-bold text-white shadow-sm ring-2 ring-white"
                  aria-hidden
                >
                  {totalCount}
                </span>
              )}
              <span
                className={`text-sm font-medium ${isSelected ? 'text-white' : isCurrentDay ? 'text-slate-900' : 'text-slate-700'}`}
              >
                {day}
              </span>
            </div>
          )
        })}
      </div>

      {/* 선택된 날짜의 이벤트 목록 */}
      {selectedDate && (selectedEvents.length > 0 || selectedTravel.length > 0) && (
        <div className="mt-5 pt-4 border-t border-slate-200">
          <p className="text-xs font-medium text-slate-500 mb-3">
            {new Date(selectedDate).toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              weekday: 'long',
            })}
          </p>
          <div className="space-y-2">
            {selectedEvents.map((event) => (
              <Link
                key={event.id}
                href="/wedding-prep"
                className="block p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-100 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs text-slate-500">결혼준비</span>
                      <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${getPriorityColor(event.priority)}`}>
                        {event.priority === 2 ? '높음' : event.priority === 1 ? '보통' : '낮음'}
                      </span>
                      <span className="text-xs text-slate-600">{event.category}</span>
                      <div className={`w-2 h-2 rounded-full shrink-0 ${getStatusColor(event.status)}`} />
                    </div>
                    <p className="text-sm font-medium text-slate-900 truncate">{event.content}</p>
                  </div>
                  <p className="text-sm font-semibold text-slate-800 whitespace-nowrap">
                    {event.amount.toLocaleString()}원
                  </p>
                </div>
              </Link>
            ))}
            {selectedTravel.map((te) => (
              <Link
                key={te.id}
                href="/schedule"
                className="block p-3 rounded-xl bg-amber-50/80 hover:bg-amber-100/80 border border-amber-200/60 transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-amber-700">일정계획</span>
                  {te.dueDate && (
                    <span className="text-xs text-slate-500">
                      {new Date(te.dueDate).toLocaleString('ko-KR', { timeStyle: 'short' })}
                    </span>
                  )}
                </div>
                <p className="text-sm font-medium text-slate-900 mt-0.5">{te.title}</p>
                {te.note && <p className="text-xs text-slate-600 mt-0.5">{te.note}</p>}
              </Link>
            ))}
          </div>
        </div>
      )}

      {selectedDate && selectedEvents.length === 0 && selectedTravel.length === 0 && (
        <div className="mt-5 pt-4 border-t border-slate-200 text-center py-4">
          <p className="text-sm text-slate-500">선택한 날짜에 예정된 항목이 없습니다.</p>
        </div>
      )}
    </div>
  )
}
