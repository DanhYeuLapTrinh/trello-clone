'use server'

import { protectedActionClient } from '@/lib/safe-action'
import prisma from '@/prisma/prisma'
import { ConflictError } from '@/types/error'
import { Prisma } from '@prisma/client/edge'
import { flattenValidationErrors } from 'next-safe-action'
import { getMe } from '../users/actions'
import { createWorkspaceSchema } from './validations'

export const getMeWorkspaces = async () => {
  const { id } = await getMe()
  const workspaces = await getWorkspacesByUserId(id)

  return workspaces
}

export const getWorkspacesByUserId = async (userId: string) => {
  const workspaces = await prisma.workspace.findMany({
    where: {
      memberships: {
        some: { userId }
      }
    }
  })

  return workspaces
}

export const createWorkspace = protectedActionClient
  .inputSchema(createWorkspaceSchema, {
    handleValidationErrorsShape: async (ve) => flattenValidationErrors(ve).fieldErrors
  })
  .action(async ({ parsedInput, ctx }) => {
    try {
      const workspace = await prisma.workspace.create({
        data: {
          name: parsedInput.name,
          shortName: parsedInput.shortName,
          websiteUrl: parsedInput.websiteUrl || null,
          description: parsedInput.description || null,
          memberships: {
            create: {
              user: {
                connect: { id: ctx.currentUser.id }
              },
              role: 'Owner'
            }
          }
        }
      })

      return workspace
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new ConflictError('Tên hoặc tên ngắn gọn đã tồn tại.')
      }
      throw error
    }
  })
