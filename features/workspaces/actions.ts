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

  const workspaces = await prisma.workspace.findMany({
    where: {
      ownerId: id,
      isDeleted: false
    },
    select: {
      id: true,
      shortName: true,
      name: true
    },
    orderBy: {
      createdAt: 'asc'
    }
  })

  return workspaces
}

export const getMeWorkspacesWithBoards = async () => {
  const { id } = await getMe()

  const workspaces = await prisma.workspace.findMany({
    where: {
      ownerId: id,
      isDeleted: false
    },
    select: {
      id: true,
      name: true,
      imageUrl: true,
      shortName: true,
      boards: {
        select: {
          id: true,
          name: true,
          slug: true,
          background: true,
          visibility: true
        }
      }
    },
    orderBy: {
      createdAt: 'asc'
    }
  })

  return workspaces
}

export const getGuestWorkspacesWithBoards = async () => {
  const { id } = await getMe()

  const workspaces = await prisma.workspace.findMany({
    where: {
      isDeleted: false,
      boards: {
        some: {
          boardMemberships: {
            some: {
              userId: id
            }
          }
        }
      }
    },
    select: {
      id: true,
      name: true,
      imageUrl: true,
      shortName: true,
      ownerId: true,
      boards: {
        where: {
          boardMemberships: {
            some: {
              userId: id
            }
          }
        },
        select: {
          id: true,
          name: true,
          slug: true,
          background: true,
          visibility: true
        }
      }
    },
    orderBy: { createdAt: 'asc' }
  })

  return workspaces
}

// FIXME: Cover the visibility of the boards
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
        ownerId: userId
      }
    })

    return workspace
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
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
