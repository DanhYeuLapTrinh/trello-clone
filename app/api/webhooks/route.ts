import prisma from '@/prisma/prisma'
import { verifyWebhook } from '@clerk/nextjs/webhooks'
import { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const evt = await verifyWebhook(req)

    if (evt.type === 'user.created') {
      const { id, email_addresses, first_name, last_name, image_url } = evt.data

      try {
        const newUser = await prisma.$transaction(async (tx) => {
          const createdUser = await tx.user.create({
            data: {
              clerkId: id,
              email: email_addresses[0]?.email_address,
              firstName: first_name,
              lastName: last_name,
              imageUrl: image_url
            }
          })

          const createdWorkspace = await tx.workspace.create({
            data: {
              name: `${first_name ?? ''} ${last_name ?? ''}`.trim()
                ? `${first_name ?? ''} ${last_name ?? ''}`.trim() + "'s Workspace"
                : 'My Workspace',
              shortName: Date.now().toString(),
              websiteUrl: null,
              description: null,
              memberships: {
                create: {
                  user: { connect: { id: createdUser.id } },
                  role: 'Owner'
                }
              }
            }
          })

          await tx.board.create({
            data: {
              name: 'My Board',
              slug: Date.now().toString(),
              workspaceId: createdWorkspace.id,
              ownerId: createdUser.id
            }
          })

          return createdUser
        })

        return new Response(JSON.stringify(newUser), { status: 201 })
      } catch (error) {
        console.error('Error creating user:', error)
        return new Response('Error creating user', { status: 400 })
      }
    }
    return new Response('OK', { status: 200 })
  } catch (err) {
    console.error('Error verifying webhook:', err)
    return new Response('Error verifying webhook', { status: 400 })
  }
}
