'use client'

import Container from '@/components/layout/Container'
import Dashboard from '@/components/dashboard/Dashboard'
import Calendar from '@/components/calendar/Calendar'
import { useWeddingStore } from '@/lib/store/useWeddingStore'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const { isAuthenticated, _hasHydrated } = useWeddingStore()
  const router = useRouter()

  useEffect(() => {
    if (_hasHydrated && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, _hasHydrated, router])

  if (!_hasHydrated) {
    return (
      <Container maxWidth="full" className="py-8">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-gray-600">로딩 중...</div>
        </div>
      </Container>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <Container maxWidth="full" className="py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">대시보드</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* 대시보드 - 2열 */}
        <div className="lg:col-span-2">
          <Dashboard />
        </div>

        {/* 캘린더 - 1열 */}
        <div className="lg:col-span-1">
          <Calendar />
        </div>
      </div>
    </Container>
  )
}
