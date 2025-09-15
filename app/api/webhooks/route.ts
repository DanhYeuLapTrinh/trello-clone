import prisma from '@/prisma/prisma'
import { verifyWebhook } from '@clerk/nextjs/webhooks'
import { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const evt = await verifyWebhook(req)

    if (evt.type === 'user.created') {
      const { id, email_addresses, first_name, last_name, image_url } = evt.data

      try {
        const newUser = await prisma.user.create({
          data: {
            clerkId: id,
            email: email_addresses[0]?.email_address,
            firstName: first_name,
            lastName: last_name,
            imageUrl: image_url
          }
        })

        return new Response(JSON.stringify(newUser), { status: 201 })
      } catch (error) {
        console.error('Error creating user:', error)
        return new Response('Error creating user', { status: 400 })
      }
    }
  } catch (err) {
    console.error('Error verifying webhook:', err)
    return new Response('Error verifying webhook', { status: 400 })
  }
}
