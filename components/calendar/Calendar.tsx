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

interface CalendarData {
  year: number
  month: number
  events: Record<string, CalendarEvent[]>
}

export default function Calendar() {
  const { token } = useWeddingStore()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [calendarData, setCalendarData] = useState<CalendarData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  useEffect(() => {
    if (token) {
      fetchCalendarData()
    }
  }, [token, currentDate])

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

  const selectedEvents = selectedDate && calendarData.events[selectedDate] ? calendarData.events[selectedDate] : []

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-200/50 hover:shadow-xl transition-shadow duration-300">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-base font-semibold text-gray-900">캘린더</h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={goToPreviousMonth}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={goToToday}
            className="px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          >
            오늘
          </button>
          <button
            onClick={goToNextMonth}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      <div className="mb-3">
        <h3 className="text-base font-semibold text-gray-900">
          {year}년 {monthNames[month - 1]}
        </h3>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-4">
        {dayNames.map((day) => (
          <div key={day} className="text-center text-sm font-medium text-gray-600 py-2">
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
          const events = calendarData.events[dateKey] || []
          const isCurrentDay = isToday(year, month, day)
          const isSelected = selectedDate === dateKey

          return (
            <div
              key={day}
              onClick={() => setSelectedDate(dateKey)}
              className={`aspect-square border-2 rounded-xl p-1 cursor-pointer transition-all duration-200 ${
                isSelected
                  ? 'bg-gradient-to-br from-blue-100 to-blue-200 border-blue-400 shadow-md scale-105'
                  : isCurrentDay
                  ? 'bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-300 shadow-sm'
                  : 'border-gray-200 hover:bg-gradient-to-br hover:from-gray-50 hover:to-blue-50/50 hover:border-blue-200 hover:shadow-sm'
              }`}
            >
              <div className={`text-sm font-medium mb-1 ${isCurrentDay ? 'text-blue-600' : 'text-gray-900'}`}>
                {day}
              </div>
              <div className="space-y-1">
                {events.slice(0, 2).map((event) => (
                  <div
                    key={event.id}
                    className={`text-xs px-1 py-0.5 rounded truncate ${getPriorityColor(event.priority)}`}
                    title={`${event.category}: ${event.content} (${event.amount.toLocaleString()}원)`}
                  >
                    <div className="flex items-center space-x-1">
                      <div className={`w-1.5 h-1.5 rounded-full ${getStatusColor(event.status)}`} />
                      <span className="truncate">{event.content}</span>
                    </div>
                  </div>
                ))}
                {events.length > 2 && (
                  <div className="text-xs text-gray-500 px-1">+{events.length - 2}개</div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* 선택된 날짜의 이벤트 목록 */}
      {selectedDate && selectedEvents.length > 0 && (
        <div className="mt-6 border-t pt-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">
            {new Date(selectedDate).toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              weekday: 'long',
            })}
          </h3>
          <div className="space-y-2">
            {selectedEvents.map((event) => (
              <Link
                key={event.id}
                href="/wedding-prep"
                className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${getPriorityColor(event.priority)}`}>
                        {event.priority === 2 ? '높음' : event.priority === 1 ? '보통' : '낮음'}
                      </span>
                      <span className="text-xs text-gray-600">{event.category}</span>
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(event.status)}`} />
                    </div>
                    <p className="text-sm font-medium text-gray-900">{event.content}</p>
                  </div>
                  <p className="text-sm font-medium text-gray-900 ml-4">
                    {event.amount.toLocaleString()}원
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {selectedDate && selectedEvents.length === 0 && (
        <div className="mt-6 border-t pt-4 text-center text-sm text-gray-500">
          선택한 날짜에 예정된 항목이 없습니다.
        </div>
      )}
    </div>
  )
}
