import { getMe } from '@/features/users/queries'
import * as Ably from 'ably'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    if (!process.env.ABLY_API_KEY) {
      throw new Error('Missing ABLY_API_KEY environment variable')
    }
    const { id } = await getMe()
    const client = new Ably.Rest(process.env.ABLY_API_KEY)

    const tokenRequestData = await client.auth.createTokenRequest({ clientId: id })

    return NextResponse.json(tokenRequestData)
  } catch (error) {
    return NextResponse.json({ errorMessage: (error as Error).message }, { status: 500 })
  }
}
