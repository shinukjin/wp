'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useWeddingStore } from '@/lib/store/useWeddingStore'
import LoadingScreen from '@/components/ui/LoadingScreen'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, _hasHydrated } = useWeddingStore()

  useEffect(() => {
    if (!_hasHydrated) return
    if (!user?.isAdmin) {
      router.replace('/')
      return
    }
  }, [_hasHydrated, user?.isAdmin, router])

  if (!_hasHydrated || !user?.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingScreen className="min-h-[60vh]" />
      </div>
    )
  }

  const navItems = [
    { href: '/admin', label: '대시보드' },
    { href: '/admin/users', label: '회원 관리' },
  ]

  return (
    <div className="min-h-screen bg-[var(--app-bg)]">
      <header className="sticky top-0 z-40 border-b border-[var(--app-border)] bg-[var(--app-surface)] shadow-sm">
        <div className="w-full max-w-screen-2xl mx-auto px-3 sm:px-4 flex h-14 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link
              href="/admin"
              className="text-lg font-bold text-amber-800 hover:text-amber-700"
            >
              관리자
            </Link>
            <nav className="flex gap-1">
              {navItems.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    pathname === href
                      ? 'bg-amber-100 text-amber-900'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>
          <Link
            href="/"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            사이트로 돌아가기
          </Link>
        </div>
      </header>
      <main className="w-full max-w-screen-2xl mx-auto px-3 sm:px-4 py-6">{children}</main>
    </div>
  )
}
