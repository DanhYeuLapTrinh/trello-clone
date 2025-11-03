'use server'

import { protectedActionClient } from '@/lib/safe-action'
import prisma from '@/prisma/prisma'
import { ConflictError } from '@/shared/error'
import { Prisma } from '@prisma/client/edge'
import { flattenValidationErrors } from 'next-safe-action'
import { CreateWorkspaceSchema, createWorkspaceSchema } from './validations'

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
