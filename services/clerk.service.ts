import prisma from '@/prisma/prisma'
import { UIUser, userSelect } from '@/prisma/queries/user'
import { ConflictError } from '@/shared/error'
import { Prisma } from '@prisma/client'

class ClerkService {
  public async syncUserFromClerk({
    clerkId,
    firstName,
    lastName,
    email,
    imageUrl
  }: {
    clerkId: string
    firstName: string | null
    lastName: string | null
    email: string
    imageUrl: string
  }): Promise<UIUser | null> {
    try {
      const fullName = `${firstName ?? ''} ${lastName ?? ''}`.trim() || email.split('@')[0]

      const user = await prisma.$transaction(async (tx) => {
        let upsertedUser = await tx.user.findUnique({
          where: {
            clerkId
          },
          select: userSelect
        })

        if (!upsertedUser) {
          try {
            // New user from clerk, sync to database
            upsertedUser = await tx.user.create({
              data: {
                clerkId,
                email,
                firstName,
                lastName,
                fullName,
                imageUrl
              },
              select: userSelect
            })
          } catch (error) {
            // Handle race condition: if another request created the user simultaneously,
            // fetch it from the database instead of failing
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
              upsertedUser = await tx.user.findUnique({
                where: {
                  clerkId
                },
                select: userSelect
              })

              if (!upsertedUser) {
                throw new Error('Failed to create or fetch user')
              }
            } else {
              throw error
            }
          }
        } else {
          // User already exists, check if email is already in use
          const existingEmailUser = await tx.user.findUnique({
            where: {
              email
            },
            select: {
              clerkId: true
            }
          })

          // If email is in use by another user, throw conflict error
          if (existingEmailUser && existingEmailUser.clerkId !== clerkId) {
            throw new ConflictError('Email already in use')
          }

          // Email is not in use, update user
          upsertedUser = await tx.user.update({
            where: {
              clerkId
            },
            data: {
              email
            },
            select: userSelect
          })
        }

        const existingWorkspace = await tx.workspace.findFirst({
          where: {
            ownerId: upsertedUser.id
          }
        })

        if (!existingWorkspace) {
          const createdWorkspace = await tx.workspace.create({
            data: {
              name: `${fullName}'s Workspace`,
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
                name: `${fullName}'s Board`,
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
}

const clerkService = new ClerkService()
export default clerkService
