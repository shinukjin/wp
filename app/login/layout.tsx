import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '로그인 - Wedding Project',
  description: 'Wedding Project에 로그인하세요',
}

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
