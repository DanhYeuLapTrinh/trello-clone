import prisma from '@/prisma/prisma'
import { NotFoundError } from '@/types/error'
import { currentUser } from '@clerk/nextjs/server'
import { User } from '@prisma/client'

class ClerkService {
  public async syncUserFromClerk(clerkUserId: string): Promise<User | null> {
    try {
      const clerkUser = await currentUser()

      if (!clerkUser) return null

      const user = await prisma.$transaction(async (tx) => {
        const upsertedUser = await tx.user.upsert({
          where: {
            clerkId: clerkUser.id
          },
          update: {
            email: clerkUser.emailAddresses[0]?.emailAddress,
            firstName: clerkUser.firstName,
            lastName: clerkUser.lastName,
            imageUrl: clerkUser.imageUrl
          },
          create: {
            clerkId: clerkUserId,
            email: clerkUser.emailAddresses[0]?.emailAddress,
            firstName: clerkUser.firstName,
            lastName: clerkUser.lastName,
            imageUrl: clerkUser.imageUrl
          }
        })

        const existingWorkspace = await tx.workspace.findFirst({
          where: {
            ownerId: upsertedUser.id
          }
        })

        if (!existingWorkspace) {
          const createdWorkspace = await tx.workspace.create({
            data: {
              name: `${clerkUser.firstName ?? ''} ${clerkUser.lastName ?? ''}`.trim()
                ? `${clerkUser.firstName ?? ''} ${clerkUser.lastName ?? ''}`.trim() + "'s Workspace"
                : 'Không gian làm việc của tôi',
              shortName: Date.now().toString(),
              websiteUrl: null,
              description: null,
              ownerId: upsertedUser.id
            }
          })

          const existingBoard = await tx.board.findFirst({
            where: {
              workspaceId: createdWorkspace.id,
              ownerId: upsertedUser.id
            }
          })

          if (!existingBoard) {
            await tx.board.create({
              data: {
                name: 'Bảng của tôi',
                slug: Date.now().toString(),
                workspaceId: createdWorkspace.id,
                ownerId: upsertedUser.id
              }
            })
          }
        }

        return upsertedUser
      })

      return user
    } catch (error) {
      throw error
    }
  }

  public async ensureUserExists(clerkUserId: string) {
    try {
      let user = await prisma.user.findUnique({
        where: {
          clerkId: clerkUserId
        }
      })

      if (!user) {
        user = await this.syncUserFromClerk(clerkUserId)
      }

      if (!user) {
        throw new NotFoundError('User')
      }

      return user
    } catch (error) {
      throw error
    }
  }
}

const clerkService = new ClerkService()
export default clerkService
