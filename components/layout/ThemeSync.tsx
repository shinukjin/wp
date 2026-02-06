'use client'

import { useEffect } from 'react'
import { useThemeStore } from '@/lib/store/useThemeStore'

/** 스토어 테마를 html data-theme에 동기화 */
export default function ThemeSync() {
  const theme = useThemeStore((s) => s.theme)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  return null
}
