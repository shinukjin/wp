import { cookies } from 'next/headers'
import { verifyToken, extractToken } from './jwt'
import { JwtPayload } from './jwt'

/**
 * 서버 사이드에서 인증된 사용자 정보 가져오기
 */
export async function getAuthenticatedUser(): Promise<JwtPayload | null> {
  try {
    const cookieStore = await cookies()
    const authCookie = cookieStore.get('token')
    
    if (!authCookie?.value) {
      return null
    }

    const token = extractToken(`Bearer ${authCookie.value}`) || authCookie.value
    const payload = verifyToken(token)
    return payload
  } catch (error) {
    return null
  }
}

/**
 * 요청 헤더에서 인증된 사용자 정보 가져오기
 */
export function getAuthFromHeader(authHeader: string | null): JwtPayload | null {
  try {
    if (!authHeader) {
      return null
    }

    const token = extractToken(authHeader)
    if (!token) {
      return null
    }

    const payload = verifyToken(token)
    return payload
  } catch (error) {
    return null
  }
}
