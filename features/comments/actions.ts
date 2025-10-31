'use server'

import { protectedActionClient } from '@/lib/safe-action'
import prisma from '@/prisma/prisma'
import { NotFoundError } from '@/types/error'
import { flattenValidationErrors } from 'next-safe-action'
import { revalidatePath } from 'next/cache'
import { createCommentSchema } from './validations'

export const createComment = protectedActionClient
  .inputSchema(createCommentSchema, {
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

      const card = await prisma.card.findUnique({
        where: {
          slug: parsedInput.cardSlug
        }
      })

      if (!card) {
        throw new NotFoundError('Card')
      }

      const comment = await prisma.comment.create({
        data: {
          content: parsedInput.content,
          cardId: card.id,
          userId: ctx.currentUser.id
        }
      })

      revalidatePath(`/b/${parsedInput.boardSlug}/${parsedInput.cardSlug}`)

      return comment
    } catch (error) {
      throw error
    }
  })
