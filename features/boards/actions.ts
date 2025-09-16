'use server'

import { protectedActionClient } from '@/lib/safe-action'
import { slugify } from '@/lib/utils'
import prisma from '@/prisma/prisma'
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
