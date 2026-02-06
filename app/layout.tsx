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

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko" className="overflow-x-hidden">
      <body className={`${inter.className} bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20 min-h-screen overflow-x-hidden`}>
        <StoreProvider>
          <div className="flex min-h-screen flex-col min-w-0 w-full max-w-screen-2xl mx-auto">
            <HeaderWrapper />
            <main className="flex-1 min-w-0 overflow-x-hidden">{children}</main>
            <Footer />
          </div>
        </StoreProvider>
      </body>
    </html>
  )
}
