'use client'

import { useEffect } from 'react'
import { useWeddingStore } from '@/lib/store/useWeddingStore'

/**
 * Zustand persist 하이드레이션을 전역적으로 관리하는 Provider
 * 앱 레벨에서 한 번만 하이드레이션을 완료하도록 보장
 */
export function StoreProvider({ children }: { children: React.ReactNode }) {
  const setHasHydrated = useWeddingStore((state) => state.setHasHydrated)
  const _hasHydrated = useWeddingStore((state) => state._hasHydrated)

  useEffect(() => {
    // 하이드레이션이 아직 완료되지 않았다면 완료 처리
    if (!_hasHydrated) {
      setHasHydrated(true)
    }
  }, [_hasHydrated, setHasHydrated])

  return <>{children}</>
}
