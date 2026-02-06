'use client'

import { useWeddingStore } from '@/lib/store/useWeddingStore'
import LoadingScreen from '@/components/ui/LoadingScreen'

/**
 * 하이드레이션 완료 전에는 공통 로딩 화면만 표시하고, 완료 후 children 렌더
 * 새로고침 시 각 페이지에서 따로 로딩이 보이지 않도록 함
 */
export default function HydrationGuard({
  children,
}: {
  children: React.ReactNode
}) {
  const _hasHydrated = useWeddingStore((s) => s._hasHydrated)

  if (!_hasHydrated) {
    return <LoadingScreen />
  }

  return <>{children}</>
}
