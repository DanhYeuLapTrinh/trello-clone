import AppProvider from '@/components/app.provider'
import type { Metadata } from 'next'
import { Noto_Sans } from 'next/font/google'
import './globals.css'

const notoSans = Noto_Sans({
  subsets: ['latin']
})

export const metadata: Metadata = {
  title: 'Trello Clone',
  description: 'A clone of the popular project management tool Trello'
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <AppProvider>
      <html lang='en'>
        <body className={`${notoSans.className} antialiased`}>{children}</body>
      </html>
    </AppProvider>
  )
}
