import type { Metadata } from 'next'
import { JetBrains_Mono } from 'next/font/google'
import './globals.css'

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
})

export const metadata: Metadata = {
  title: 'masternote',
  description: 'your mind, on the page',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={mono.variable}>
      <body>{children}</body>
    </html>
  )
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',   // ← this is what unlocks env(safe-area-inset-*)
}