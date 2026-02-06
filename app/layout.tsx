import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import ThemeSync from '@/components/layout/ThemeSync'
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
    <html lang="ko" className="overflow-x-hidden" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('wedding-theme');var s=t?JSON.parse(t):null;var theme=(s&&s.state&&s.state.theme==='white')?'white':'warm';document.documentElement.dataset.theme=theme;}catch(e){document.documentElement.dataset.theme='warm';}})();`,
          }}
        />
      </head>
      <body className={`${inter.className} min-h-screen overflow-x-hidden`}>
        <StoreProvider>
          <ThemeSync />
          {children}
        </StoreProvider>
      </body>
    </html>
  )
}
