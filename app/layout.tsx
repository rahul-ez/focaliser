import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import { TopNav } from '@/components/nav/TopNav'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' })

export const metadata: Metadata = {
  title: 'Focaliser',
  description: 'Distraction-free focus timer and habit tracker',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans min-h-screen flex flex-col">
        <TopNav />
        <main className="flex-1 flex flex-col">{children}</main>
      </body>
    </html>
  )
}

