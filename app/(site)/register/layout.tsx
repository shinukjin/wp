import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '회원가입 - Wedding Project',
  description: 'Wedding Project에 회원가입하세요',
}

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
