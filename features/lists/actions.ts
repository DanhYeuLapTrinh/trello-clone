'use server'

import { protectedActionClient } from '@/lib/safe-action'
import prisma from '@/prisma/prisma'
import { ConflictError } from '@/types/error'
import { Prisma } from '@prisma/client/edge'
import { flattenValidationErrors } from 'next-safe-action'
import { revalidatePath } from 'next/cache'
import { createListSchema } from './validations'

export const createList = protectedActionClient
  .inputSchema(createListSchema, {
    handleValidationErrorsShape: async (ve) => flattenValidationErrors(ve).fieldErrors
  })
  .action(async ({ parsedInput }) => {
    try {
      const latestPosition = await prisma.list.findFirst({
        where: {
          boardId: parsedInput.boardId
        },
        orderBy: {
          position: 'desc'
        }
      })

      const list = await prisma.list.create({
        data: {
          name: parsedInput.name,
          boardId: parsedInput.boardId,
          position: (latestPosition?.position ?? -1) + 1
        }
      })

      revalidatePath(`/b/${parsedInput.slug}`)

      return list
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictError('Tên danh sách đã tồn tại.')
      }
      throw error
    }
  })

export const getListCards = async (listId: string) => {
  const cards = await prisma.card.findMany({
    where: {
      listId: listId
    },
    orderBy: {
      position: 'asc'
    }
  })

  return cards
}
