import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/utils/jwt'

/**
 * 서버 컴포넌트에서 초기 인증 상태 확인
 * 쿠키에서 토큰이 있는지 확인하여 인증 상태·관리자 여부 반환 (새로고침 시 깜빡임 방지)
 */
export async function getServerAuthState(): Promise<{
  isAuthenticated: boolean
  token: string | null
  isAdmin: boolean
}> {
  try {
    const cookieStore = await cookies()
    const tokenCookie = cookieStore.get('auth-token')

    if (tokenCookie?.value) {
      try {
        const payload = verifyToken(tokenCookie.value)
        return {
          isAuthenticated: true,
          token: tokenCookie.value,
          isAdmin: payload.isAdmin === true,
        }
      } catch {
        return { isAuthenticated: false, token: null, isAdmin: false }
      }
    }

    return {
      isAuthenticated: false,
      token: null,
      isAdmin: false,
    }
  } catch (error) {
    return {
      isAuthenticated: false,
      token: null,
      isAdmin: false,
    }
  }
}
