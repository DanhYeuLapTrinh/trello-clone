import AblyClient from '@/lib/ably-client'
import QueryProvider from '@/lib/query-client'
import { ClerkProvider } from '@clerk/nextjs'
import { Toaster } from './ui/sonner'

export default function AppProvider({ children }: { children: React.ReactNode }) {
  return (
    <AblyClient>
      <QueryProvider>
        <ClerkProvider>
          {children}
          <Toaster />
        </ClerkProvider>
      </QueryProvider>
    </AblyClient>
  )
}
