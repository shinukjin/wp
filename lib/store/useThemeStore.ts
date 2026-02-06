import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type AppTheme = 'white' | 'warm'

interface ThemeState {
  theme: AppTheme
  setTheme: (theme: AppTheme) => void
  toggleTheme: () => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'warm',
      setTheme: (theme) => set({ theme }),
      toggleTheme: () =>
        set((s) => ({ theme: s.theme === 'white' ? 'warm' : 'white' })),
    }),
    { name: 'wedding-theme' }
  )
)
