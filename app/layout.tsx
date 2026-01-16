import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import HeaderWrapper from '@/components/layout/HeaderWrapper'
import Footer from '@/components/layout/Footer'
import { StoreProvider } from '@/lib/providers/StoreProvider'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Wedding Project',
  description: 'Wedding management application',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className={`${inter.className} bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20 min-h-screen`}>
        <StoreProvider>
          <div className="flex min-h-screen flex-col">
            <HeaderWrapper />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </StoreProvider>
      </body>
    </html>
  )
}
