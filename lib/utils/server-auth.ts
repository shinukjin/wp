import { cookies } from 'next/headers'

/**
 * 서버 컴포넌트에서 초기 인증 상태 확인
 * 쿠키에서 토큰이 있는지 확인하여 인증 상태 반환
 */
export async function getServerAuthState(): Promise<{
  isAuthenticated: boolean
  token: string | null
}> {
  try {
    const cookieStore = await cookies()
    const tokenCookie = cookieStore.get('auth-token')
    
    if (tokenCookie?.value) {
      return {
        isAuthenticated: true,
        token: tokenCookie.value,
      }
    }
    
    return {
      isAuthenticated: false,
      token: null,
    }
  } catch (error) {
    // 서버 사이드에서 쿠키를 읽을 수 없는 경우 (예: 클라이언트 사이드 렌더링)
    return {
      isAuthenticated: false,
      token: null,
    }
  }
}
