import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Points Forest - ポイントの森',
  description: 'Gamification platform with points, achievements, and mini-games',
  keywords: ['gamification', 'points', 'games', 'achievements', 'leaderboard'],
  authors: [{ name: 'Points Forest Team' }],
  viewport: 'width=device-width, initial-scale=1',
  robots: 'index, follow',
  openGraph: {
    title: 'Points Forest - ポイントの森',
    description: 'Gamification platform with points, achievements, and mini-games',
    type: 'website',
    locale: 'ja_JP',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}