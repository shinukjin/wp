'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Container from '@/components/layout/Container'
import LoadingScreen from '@/components/ui/LoadingScreen'
import Dashboard from '@/components/dashboard/Dashboard'
import Calendar from '@/components/calendar/Calendar'
import { useWeddingStore } from '@/lib/store/useWeddingStore'

export default function Home() {
  const { isAuthenticated, _hasHydrated } = useWeddingStore()
  const router = useRouter()
  const [dashboardLoaded, setDashboardLoaded] = useState(false)
  const [calendarLoaded, setCalendarLoaded] = useState(false)

  useEffect(() => {
    if (_hasHydrated && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, _hasHydrated, router])

  if (!isAuthenticated) {
    return null
  }

  const contentReady = dashboardLoaded && calendarLoaded

  return (
    <Container maxWidth="full" className="py-4 sm:py-6 lg:py-8">
      {!contentReady && <LoadingScreen />}
      <div
        className={contentReady ? '' : 'invisible absolute'}
        aria-hidden={!contentReady}
      >
        <div className="mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">대시보드</h1>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-6">
          <div className="lg:col-span-2">
            <Dashboard onLoaded={() => setDashboardLoaded(true)} />
          </div>
          <div className="lg:col-span-1">
            <Calendar onLoaded={() => setCalendarLoaded(true)} />
          </div>
        </div>
      </div>
    </Container>
  )
}
