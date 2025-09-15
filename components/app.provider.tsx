import QueryProvider from '@/lib/react-query/query-client'
import { ClerkProvider } from '@clerk/nextjs'
import { Toaster } from './ui/sonner'

export default function AppProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <ClerkProvider>
        {children}
        <Toaster />
      </ClerkProvider>
    </QueryProvider>
  )
}
