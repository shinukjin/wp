import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  email: string
  name?: string
}

interface WeddingState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  _hasHydrated: boolean
  setUser: (user: User | null) => void
  setToken: (token: string | null) => void
  setHasHydrated: (hasHydrated: boolean) => void
  login: (user: User, token: string) => void
  logout: () => void
}

export const useWeddingStore = create<WeddingState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      _hasHydrated: false, // 하이드레이션 상태 추가
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setToken: (token) => set({ token }),
      setHasHydrated: (hasHydrated: boolean) => set({ _hasHydrated: hasHydrated }),
      login: (user, token) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('token', token)
        }
        set({ user, token, isAuthenticated: true })
      },
      logout: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token')
        }
        set({ user: null, token: null, isAuthenticated: false })
      },
    }),
    {
      name: 'wedding-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => {
        // 하이드레이션 시작
        return (state) => {
          // 하이드레이션 완료 후 상태 설정
          state?.setHasHydrated(true)
        }
      },
    }
  )
)
