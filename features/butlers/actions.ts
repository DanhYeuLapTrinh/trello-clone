'use server'

import { protectedActionClient } from '@/lib/safe-action'
import prisma from '@/prisma/prisma'
import { NotFoundError } from '@/types/error'
import { ButlerCategory } from '@prisma/client'
import { flattenValidationErrors } from 'next-safe-action'
import { revalidatePath } from 'next/cache'
import { createButlerSchema } from './validations/server'

export const getBoardButlers = async (slug: string, category: ButlerCategory) => {
  const butlers = await prisma.butler.findMany({
    where: {
      board: {
        slug: slug
      },
      category: category
    },
    orderBy: {
      updatedAt: 'desc'
    }
  })

  return butlers
}

export const createButler = protectedActionClient
  .inputSchema(createButlerSchema, {
    handleValidationErrorsShape: async (ve) => flattenValidationErrors(ve).fieldErrors
  })
  .action(async ({ parsedInput }) => {
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
          details: {
            trigger: parsedInput.trigger,
            actions: parsedInput.actions
          }
        }
      })

      revalidatePath(`/b/${parsedInput.boardSlug}`)

      return { message: 'Butler đã được tạo thành công.' }
    } catch (error) {
      console.log(error)
      throw error
    }
  })
