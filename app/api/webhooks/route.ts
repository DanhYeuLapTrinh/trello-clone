import clerkService from '@/services/clerk.service'
import { verifyWebhook } from '@clerk/nextjs/webhooks'
import { revalidatePath } from 'next/cache'
import { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const evt = await verifyWebhook(req)

    if (evt.type === 'user.created') {
      const { id } = evt.data

      try {
        const user = await clerkService.syncUserFromClerk(id)

        revalidatePath('/(dashboard)', 'layout')

        return new Response(JSON.stringify(user), { status: 201 })
      } catch (error) {
        console.error('Error syncing user from Clerk:', error)
        return new Response('Error syncing user', { status: 400 })
      }
    }
    return new Response('OK', { status: 200 })
  } catch (err) {
    console.error('Error verifying webhook:', err)
    return new Response('Error verifying webhook', { status: 400 })
  }
}
