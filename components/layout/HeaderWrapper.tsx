import { getServerAuthState } from '@/lib/utils/server-auth'
import Header from './Header'

/**
 * 서버 컴포넌트 래퍼
 * 서버에서 인증 상태를 확인하여 Header에 전달
 */
export default async function HeaderWrapper() {
  const { isAuthenticated: serverIsAuthenticated, token } = await getServerAuthState()

  return <Header initialIsAuthenticated={serverIsAuthenticated} initialToken={token} />
}
