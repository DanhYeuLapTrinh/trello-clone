'use server'

import { protectedActionClient } from '@/lib/safe-action'
import { slugify } from '@/lib/utils'
import prisma from '@/prisma/prisma'
import { NotFoundError } from '@/types/error'
import { flattenValidationErrors } from 'next-safe-action'
import { createBoardSchema } from './validations'

export const createBoard = protectedActionClient
  .inputSchema(createBoardSchema, {
    handleValidationErrorsShape: async (ve) => flattenValidationErrors(ve).fieldErrors
  })
  .action(async ({ parsedInput, ctx }) => {
    try {
      const board = await prisma.board.create({
        data: {
          name: parsedInput.name,
          background: parsedInput.background,
          visibility: parsedInput.visibility,
          description: parsedInput.description,
          workspaceId: parsedInput.workspaceId,
          slug: slugify(parsedInput.name),
          ownerId: ctx.currentUser.id
        }
      })

      return board
    } catch (error) {
      throw error
    }
  })

export const getBoardWithWorkspace = async (slug: string) => {
  try {
    const board = await prisma.board.findUnique({
      where: {
        slug
      },
      include: {
        workspace: true
      }
    })

    if (!board) {
      throw new NotFoundError('Board')
    }

    return {
      board,
      workspace: board.workspace
    }
  } catch (error) {
    throw error
  }
}

export const getBoardLists = async (slug: string) => {
  try {
    const board = await prisma.board.findUnique({
      where: {
        slug
      },
      include: {
        lists: {
          orderBy: {
            position: 'asc'
          }
        }
      }
    })

    if (!board) {
      throw new NotFoundError('Lists')
    }

    return board.lists
  } catch (error) {
    throw error
  }
}
