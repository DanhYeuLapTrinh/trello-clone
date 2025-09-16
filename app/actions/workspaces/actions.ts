'use server'

import { protectedActionClient } from '@/lib/safe-action'
import prisma from '@/prisma/prisma'
import { ConflictError } from '@/types/error'
import { Prisma } from '@prisma/client/edge'
import { flattenValidationErrors } from 'next-safe-action'
import { getMe } from '../users/actions'
import { CreateWorkspaceSchema, createWorkspaceSchema } from './validations'

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

export const getWorkspaceWithBoards = async (shortName: string) => {
  const workspace = await prisma.workspace.findUnique({
    where: {
      shortName
    },
    include: {
      boards: true
    }
  })

  return workspace
}

export const createWorkspaceInternal = async (workspaceData: CreateWorkspaceSchema, userId: string) => {
  try {
    const workspace = await prisma.workspace.create({
      data: {
        name: workspaceData.name,
        shortName: workspaceData.shortName,
        websiteUrl: workspaceData.websiteUrl || null,
        description: workspaceData.description || null,
        memberships: {
          create: {
            user: {
              connect: { id: userId }
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
}

export const createWorkspace = protectedActionClient
  .inputSchema(createWorkspaceSchema, {
    handleValidationErrorsShape: async (ve) => flattenValidationErrors(ve).fieldErrors
  })
  .action(async ({ parsedInput, ctx }) => {
    return createWorkspaceInternal(parsedInput, ctx.currentUser.id)
  })
