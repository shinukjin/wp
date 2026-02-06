'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import LoadingScreen from '@/components/ui/LoadingScreen'
import apiClient from '@/lib/api/client'

interface Stats {
  dailyLoginCount: number
  dailyActiveUsers: number
  totalUsers: number
  pendingCount: number
  approvedCount: number
  weeklyLoginCount: number
  at: string
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await apiClient.get('/admin/stats')
        setStats(res.data)
      } catch (e: any) {
        if (e.response?.status === 403) {
          setError('관리자만 접근할 수 있습니다.')
          return
        }
        setError(e.response?.data?.error || '통계를 불러오는 중 오류가 발생했습니다.')
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  if (loading) {
    return <LoadingScreen message="통계 로딩 중..." />
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 border border-red-200 p-4">
        <p className="text-sm text-red-800">{error}</p>
      </div>
    )
  }

  if (!stats) return null

  const cards = [
    {
      title: '당일 접속 수',
      value: stats.dailyLoginCount,
      sub: '오늘 로그인 횟수',
      href: null,
      color: 'bg-amber-50 border-amber-200 text-amber-900',
    },
    {
      title: '당일 접속 사용자',
      value: stats.dailyActiveUsers,
      sub: '오늘 로그인한 고유 사용자',
      href: null,
      color: 'bg-blue-50 border-blue-200 text-blue-900',
    },
    {
      title: '전체 회원',
      value: stats.totalUsers,
      sub: `승인 완료 ${stats.approvedCount}명`,
      href: '/admin/users',
      color: 'bg-gray-50 border-gray-200 text-gray-900',
    },
    {
      title: '승인 대기',
      value: stats.pendingCount,
      sub: '가입 후 승인 대기',
      href: '/admin/users',
      color: 'bg-orange-50 border-orange-200 text-orange-900',
    },
    {
      title: '주간 로그인 수',
      value: stats.weeklyLoginCount,
      sub: '최근 7일 로그인 횟수',
      href: null,
      color: 'bg-green-50 border-green-200 text-green-900',
    },
  ]

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">대시보드</h1>
        <p className="mt-1 text-sm text-gray-500">
          기준 시각: {new Date(stats.at).toLocaleString('ko-KR')}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {cards.map((card) => (
          <div
            key={card.title}
            className={`rounded-xl border p-4 ${card.color}`}
          >
            <p className="text-xs font-medium opacity-80">{card.title}</p>
            <p className="mt-1 text-2xl font-bold">{card.value}</p>
            <p className="mt-0.5 text-xs opacity-80">{card.sub}</p>
            {card.href && (
              <Link
                href={card.href}
                className="mt-2 inline-block text-xs font-medium underline"
              >
                보기 →
              </Link>
            )}
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] p-6">
        <h2 className="text-lg font-semibold text-gray-900">빠른 이동</h2>
        <ul className="mt-2 space-y-1 text-sm">
          <li>
            <Link href="/admin/users" className="text-amber-700 hover:underline">
              회원 관리
            </Link>
            — 전체 회원 목록, 승인, 비밀번호 초기화
          </li>
        </ul>
      </div>
    </div>
  )
}
