import HeaderWrapper from '@/components/layout/HeaderWrapper'
import Footer from '@/components/layout/Footer'
import HydrationGuard from '@/components/layout/HydrationGuard'

/**
 * 메인 사이트 레이아웃 (헤더 + 본문 + 푸터)
 * /admin 이 아닌 모든 경로에 적용. 하이드레이션 전에는 공통 로딩 화면만 표시
 */
export default function SiteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col min-w-0 w-full max-w-screen-2xl mx-auto">
      <HeaderWrapper />
      <main className="flex-1 min-w-0 overflow-x-hidden flex flex-col">
        <HydrationGuard>{children}</HydrationGuard>
      </main>
      <Footer />
    </div>
  )
}
