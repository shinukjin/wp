'use client'

import { useEffect, useState } from 'react'
import apiClient from '@/lib/api/client'
import { useWeddingStore } from '@/lib/store/useWeddingStore'
import Calendar from '@/components/calendar/Calendar'
import Link from 'next/link'

interface DashboardData {
  budget: number
  totalUsed: number
  statusStats: Array<{ status: string; count: number }>
  categoryStats: Array<{ category: string; count: number }>
}

interface TravelItem {
  id: string
  title: string
  dueDate: string | null
  note: string | null
}

interface ScheduleSidebarProps {
  selectedDate?: string | null
  onSelectDate?: (dateKey: string) => void
  /** 일정 저장/삭제 시 상위에서 증가시키면 캘린더·요약이 리프레시됨 */
  scheduleRefreshKey?: number
  /** 제목·내용 검색어 (캘린더 건수 필터 반영) */
  searchQuery?: string
}

export default function ScheduleSidebar({ selectedDate, onSelectDate, scheduleRefreshKey = 0, searchQuery = '' }: ScheduleSidebarProps = {}) {
  const { token } = useWeddingStore()
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [travelItems, setTravelItems] = useState<TravelItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    const load = async () => {
      try {
        setLoading(true)
        const [dashRes, travelRes] = await Promise.all([
          apiClient.get('/dashboard'),
          apiClient.get('/travel-schedule'),
        ])
        setDashboard(dashRes.data)
        setTravelItems(travelRes.data.items || [])
      } catch {
        setDashboard(null)
        setTravelItems([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [token, scheduleRefreshKey])

  const weddingPrepTotal = dashboard?.statusStats?.reduce((s, x) => s + x.count, 0) ?? 0
  const todayStr = new Date().toISOString().slice(0, 10)
  const upcomingTravel = travelItems
    .filter((t) => t.dueDate && t.dueDate.slice(0, 10) >= todayStr)
    .sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''))
    .slice(0, 5)

  return (
    <aside className="flex flex-col gap-4 w-full">
      {/* 캘린더: 셀에는 건수만 표시, 아래에 선택 날짜 상세 (검색 시 건수 반영) */}
      <Calendar selectedDate={selectedDate} onSelectDate={onSelectDate} refreshKey={scheduleRefreshKey} searchQuery={searchQuery} />

      {/* 현재 / 결혼준비 / 일정계획 요약 */}
      <div className="bg-white rounded shadow border border-slate-200 overflow-hidden">
        <div className="px-3 py-2 bg-slate-100 border-b border-slate-200">
          <h3 className="text-xs font-semibold text-slate-700">현재 · 요약</h3>
        </div>
        <div className="p-3 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600">오늘</span>
            <span className="font-medium text-slate-900">
              {new Date().toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', weekday: 'short' })}
            </span>
          </div>
          <div className="border-t border-slate-100 pt-2 flex items-center justify-between">
            <span className="text-slate-600 text-xs">결혼 준비</span>
            <Link href="/wedding-prep" className="text-xs font-semibold text-blue-600 hover:underline">
              {loading ? '-' : `${weddingPrepTotal}건`}
            </Link>
          </div>
          <div className="border-t border-slate-100 pt-2 flex items-center justify-between">
            <span className="text-slate-600 text-xs">일정계획</span>
            <span className="text-xs font-semibold text-amber-700">
              {loading ? '-' : `${travelItems.length}건`}
            </span>
          </div>
        </div>
      </div>

      {/* 다가오는 일정 */}
      <div className="bg-white rounded shadow border border-slate-200 overflow-hidden">
        <div className="px-3 py-2 bg-amber-50 border-b border-amber-200">
          <h3 className="text-xs font-semibold text-amber-800">다가오는 일정</h3>
        </div>
        <div className="p-3">
          {loading ? (
            <p className="text-xs text-slate-500">로딩 중...</p>
          ) : upcomingTravel.length === 0 ? (
            <p className="text-xs text-slate-500">다가오는 일정이 없습니다.</p>
          ) : (
            <ul className="space-y-2">
              {upcomingTravel.map((t) => (
                <li key={t.id} className="text-xs">
                  <span className="font-medium text-slate-900">{t.title}</span>
                  {t.dueDate && (
                    <span className="block text-slate-500 mt-0.5">
                      {new Date(t.dueDate).toLocaleString('ko-KR', { dateStyle: 'short', timeStyle: 'short' })}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </aside>
  )
}
