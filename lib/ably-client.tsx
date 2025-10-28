'use client'

import * as Ably from 'ably'
import { AblyProvider } from 'ably/react'
import dynamic from 'next/dynamic'

export default dynamic(() => Promise.resolve(AblyClient), {
  ssr: false
})

const client = new Ably.Realtime({ authUrl: '/api/ably', autoConnect: typeof window !== 'undefined' })

function AblyClient({ children }: { readonly children: React.ReactNode }) {
  return <AblyProvider client={client}>{children}</AblyProvider>
}
