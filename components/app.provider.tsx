import { ClerkProvider } from '@clerk/nextjs'

export default function AppProvider({ children }: { children: React.ReactNode }) {
  return <ClerkProvider>{children}</ClerkProvider>
}
