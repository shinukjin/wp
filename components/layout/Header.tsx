'use client'

import { useMemo, useEffect, useState } from 'react'
import Link from 'next/link'
import { useWeddingStore } from '@/lib/store/useWeddingStore'
import { useThemeStore } from '@/lib/store/useThemeStore'
import { cn } from '@/lib/utils/cn'

interface HeaderProps {
  initialIsAuthenticated?: boolean
  initialToken?: string | null
}

export default function Header({ initialIsAuthenticated = false, initialToken = null }: HeaderProps) {
  const { user, isAuthenticated, logout, _hasHydrated, login } = useWeddingStore()
  const { theme, setTheme } = useThemeStore()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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

  const navLinkClass = 'block text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-colors px-4 py-3 rounded-lg touch-manipulation'
  const closeMenu = () => setMobileMenuOpen(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[var(--app-border)] bg-[var(--app-surface)]/98 backdrop-blur-md shadow-sm">
      <div className="w-full max-w-screen-2xl mx-auto flex h-14 sm:h-16 items-center justify-between px-3 sm:px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center shrink-0" onClick={closeMenu}>
          <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Wedding</span>
        </Link>

        {/* Desktop Navigation */}
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

        {/* Desktop: 테마 전환 + User Menu */}
        <div className="hidden md:flex items-center space-x-3 min-w-0 justify-end">
          <div className="flex rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] p-0.5" role="group" aria-label="테마 선택">
            <button
              type="button"
              onClick={() => setTheme('white')}
              className={cn(
                'px-2.5 py-1 text-xs font-medium rounded-md transition-colors',
                theme === 'white' ? 'bg-gray-200 text-gray-900' : 'text-gray-600 hover:text-gray-900'
              )}
            >
              화이트
            </button>
            <button
              type="button"
              onClick={() => setTheme('warm')}
              className={cn(
                'px-2.5 py-1 text-xs font-medium rounded-md transition-colors',
                theme === 'warm' ? 'bg-gray-200 text-gray-900' : 'text-gray-600 hover:text-gray-900'
              )}
            >
              백그라운드
            </button>
          </div>
          {displayIsAuthenticated ? (
            <>
              <Link href="/my-info" className="text-sm font-medium text-gray-700 hover:text-blue-600 px-2 py-1 rounded-md hover:bg-blue-50 shrink-0">
                내 정보
              </Link>
              <button onClick={handleLogout} className="text-sm font-medium text-gray-700 hover:text-red-600 px-2 py-1 rounded-md hover:bg-red-50 shrink-0">
                로그아웃
              </button>
            </>
          ) : (
            <Link href="/login" className={cn('inline-flex items-center justify-center rounded-md text-sm font-medium bg-blue-600 text-white px-4 py-2 hover:bg-blue-700 shadow-sm h-9')}>
              로그인
            </Link>
          )}
        </div>

        {/* Mobile: 테마 + 햄버거 */}
        <div className="flex md:hidden items-center gap-1">
          <div className="flex rounded-md border border-[var(--app-border)] bg-[var(--app-surface)] p-0.5" role="group" aria-label="테마 선택">
            <button
              type="button"
              onClick={() => setTheme('white')}
              className={cn(
                'px-2 py-1 text-[11px] font-medium rounded transition-colors',
                theme === 'white' ? 'bg-gray-200 text-gray-900' : 'text-gray-600'
              )}
            >
              화이트
            </button>
            <button
              type="button"
              onClick={() => setTheme('warm')}
              className={cn(
                'px-2 py-1 text-[11px] font-medium rounded transition-colors',
                theme === 'warm' ? 'bg-gray-200 text-gray-900' : 'text-gray-600'
              )}
            >
              배경
            </button>
          </div>
          {displayIsAuthenticated && (
            <Link href="/my-info" className="p-2 text-gray-600 hover:text-blue-600 rounded-lg touch-manipulation" onClick={closeMenu} aria-label="내 정보">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            </Link>
          )}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((o) => !o)}
            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 touch-manipulation"
            aria-expanded={mobileMenuOpen}
            aria-label="메뉴 열기"
          >
            {mobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu panel */}
      {mobileMenuOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/20 md:hidden" aria-hidden onClick={closeMenu} />
          <div className="absolute left-0 right-0 top-full z-50 border-b border-[var(--app-border)] bg-[var(--app-surface)] shadow-lg md:hidden">
            <nav className="flex flex-col p-3">
              <div className="flex items-center gap-2 pb-2 mb-2 border-b border-[var(--app-border)]">
                <span className="text-xs text-[var(--app-text-muted)]">테마</span>
                <div className="flex rounded-md border border-[var(--app-border)] p-0.5">
                  <button type="button" onClick={() => { setTheme('white'); closeMenu(); }} className={cn('px-2 py-1 text-xs rounded', theme === 'white' ? 'bg-gray-200 font-medium' : '')}>화이트</button>
                  <button type="button" onClick={() => { setTheme('warm'); closeMenu(); }} className={cn('px-2 py-1 text-xs rounded', theme === 'warm' ? 'bg-gray-200 font-medium' : '')}>백그라운드</button>
                </div>
              </div>
              <Link href="/wedding-prep" className={navLinkClass} onClick={closeMenu}>결혼 준비</Link>
              <Link href="/real-estate" className={navLinkClass} onClick={closeMenu}>부동산</Link>
              <Link href="/schedule" className={navLinkClass} onClick={closeMenu}>일정계획</Link>
              <div className="border-t border-gray-100 mt-2 pt-2">
                {displayIsAuthenticated ? (
                  <button type="button" onClick={() => { closeMenu(); handleLogout(); }} className={cn(navLinkClass, 'w-full text-left text-red-600 hover:bg-red-50')}>
                    로그아웃
                  </button>
                ) : (
                  <Link href="/login" className={cn(navLinkClass, 'bg-blue-600 text-white hover:bg-blue-700 hover:text-white')} onClick={closeMenu}>
                    로그인
                  </Link>
                )}
              </div>
            </nav>
          </div>
        </>
      )}
    </header>
  )
}