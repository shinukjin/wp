import { getServerAuthState } from '@/lib/utils/server-auth'
import Header from './Header'

/**
 * 서버 컴포넌트 래퍼
 * 서버에서 인증 상태를 확인하여 Header에 전달 (새로고침 시 관리자 링크 유지)
 */
export default async function HeaderWrapper() {
  const { isAuthenticated: serverIsAuthenticated, token, isAdmin: serverIsAdmin } = await getServerAuthState()

  return (
    <Header
      initialIsAuthenticated={serverIsAuthenticated}
      initialToken={token}
      initialIsAdmin={serverIsAdmin}
    />
  )
}
