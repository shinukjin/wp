'use client'

import { useMemo, useEffect } from 'react'
import Link from 'next/link'
import { useWeddingStore } from '@/lib/store/useWeddingStore'
import { cn } from '@/lib/utils/cn'

interface HeaderProps {
  initialIsAuthenticated?: boolean
  initialToken?: string | null
}

export default function Header({ initialIsAuthenticated = false, initialToken = null }: HeaderProps) {
  const { user, isAuthenticated, logout, _hasHydrated, login } = useWeddingStore()

  // 서버에서 받은 초기 인증 상태를 우선 사용하고, 하이드레이션 후 Zustand 상태와 동기화
  const displayIsAuthenticated = useMemo(() => {
    // 하이드레이션이 완료되지 않았다면 서버에서 받은 초기 상태 사용
    if (!_hasHydrated) {
      return initialIsAuthenticated
    }
    
    // 하이드레이션 완료 후에는 스토어 상태 사용
    return isAuthenticated
  }, [_hasHydrated, initialIsAuthenticated, isAuthenticated])

  // 로그아웃 처리 (쿠키도 함께 삭제)
  const handleLogout = async () => {
    try {
      // 로그아웃 API 호출하여 쿠키 삭제
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch (error) {
      // 에러 무시 (이미 로그아웃 처리됨)
    } finally {
      // Zustand 스토어에서 로그아웃
      logout()
      // 페이지 리프레시하여 서버 상태 동기화
      window.location.href = '/'
    }
  }

  // 서버에서 받은 토큰이 있고 하이드레이션이 완료되지 않았다면 동기화
  useEffect(() => {
    if (initialToken && !_hasHydrated && typeof window !== 'undefined') {
      // localStorage에 토큰이 없으면 서버에서 받은 토큰 설정
      const localToken = localStorage.getItem('token')
      if (!localToken && initialToken) {
        localStorage.setItem('token', initialToken)
      }
    }
  }, [initialToken, _hasHydrated])

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200/50 bg-white/95 backdrop-blur-md supports-[backdrop-filter]:bg-white/80 shadow-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Wedding</span>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link href="/wedding-prep" className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors px-2 py-1 rounded-md hover:bg-blue-50">
            결혼 준비
          </Link>
          <Link href="/real-estate" className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors px-2 py-1 rounded-md hover:bg-blue-50">
            부동산
          </Link>
          <Link href="/schedule" className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors px-2 py-1 rounded-md hover:bg-blue-50">
            일정계획
          </Link>
        </nav>

        {/* User Menu - 서버에서 받은 초기 상태로 즉시 표시 */}
        <div className="flex items-center space-x-4 min-w-[120px] justify-end">
          {displayIsAuthenticated ? (
            <>
              <Link
                href="/my-info"
                className="text-sm font-medium text-gray-700 transition-colors hover:text-blue-600 px-2 py-1 rounded-md hover:bg-blue-50"
              >
                {'내 정보'}
              </Link>
              <button
                onClick={handleLogout}
                className="text-sm font-medium text-gray-700 transition-colors hover:text-red-600 px-2 py-1 rounded-md hover:bg-red-50"
              >
                로그아웃
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className={cn(
                'inline-flex items-center justify-center rounded-md text-sm font-medium',
                'bg-blue-600 text-white px-4 py-2',
                'transition-colors hover:bg-blue-700 shadow-sm',
                'h-9'
              )}
            >
              로그인
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}