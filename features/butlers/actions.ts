'use server'

import { protectedActionClient } from '@/lib/safe-action'
import prisma from '@/prisma/prisma'
import { NotFoundError } from '@/shared/error'
import { flattenValidationErrors } from 'next-safe-action'
import { revalidatePath } from 'next/cache'
import { createButlerSchema } from './validations/server'

export const createButler = protectedActionClient
  .inputSchema(createButlerSchema, {
    handleValidationErrorsShape: async (ve) => flattenValidationErrors(ve).fieldErrors
  })
  .action(async ({ parsedInput, ctx }) => {
    try {
      const board = await prisma.board.findUnique({
        where: {
          slug: parsedInput.boardSlug
        }
      })

      if (!board) {
        throw new NotFoundError('Board')
      }

      await prisma.butler.create({
        data: {
          boardId: board.id,
          category: parsedInput.category,
          handlerKey: parsedInput.handlerKey,
          creatorId: ctx.currentUser.id,
          details: {
            trigger: parsedInput.trigger,
            actions: parsedInput.actions
          }
        }
      })

      revalidatePath(`/b/${parsedInput.boardSlug}`)

      return { message: 'Butler đã được tạo thành công.' }
    } catch (error) {
      throw error
    }
  })
