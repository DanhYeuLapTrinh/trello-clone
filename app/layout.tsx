import AppProvider from '@/components/app.provider'
import type { Metadata } from 'next'
import { Fira_Code, Noto_Sans } from 'next/font/google'
import './globals.css'

const notoSans = Noto_Sans({
  subsets: ['latin']
})

const firaCode = Fira_Code({
  subsets: ['latin'],
  variable: '--font-fira-code'
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
    <html lang='en'>
      <body className={`${notoSans.className} ${firaCode.variable} antialiased`}>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  )
}
