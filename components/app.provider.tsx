import QueryProvider from '@/lib/react-query/query-client'
import { ClerkProvider } from '@clerk/nextjs'

export default function AppProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <ClerkProvider>{children}</ClerkProvider>
    </QueryProvider>
  )
}
