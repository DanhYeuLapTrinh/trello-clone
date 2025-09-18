'use server'

import { protectedActionClient } from '@/lib/safe-action'
import prisma from '@/prisma/prisma'
import { ConflictError, NotFoundError } from '@/types/error'
import { Prisma } from '@prisma/client/edge'
import { flattenValidationErrors } from 'next-safe-action'
import { revalidatePath } from 'next/cache'
import { createListSchema, moveListSchema } from './validations'

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

export const moveList = protectedActionClient
  .inputSchema(moveListSchema, {
    handleValidationErrorsShape: async (ve) => flattenValidationErrors(ve).fieldErrors
  })
  .action(async ({ parsedInput }) => {
    try {
      // Get the list to move
      const listToMove = await prisma.list.findUnique({
        where: { id: parsedInput.listId }
      })

      if (!listToMove) {
        throw new NotFoundError('List')
      }

      // Get all lists in the board ordered by position
      const allLists = await prisma.list.findMany({
        where: { boardId: listToMove.boardId },
        orderBy: { position: 'asc' }
      })

      // Remove the list being moved from the array
      const otherLists = allLists.filter((list) => list.id !== parsedInput.listId)

      // Insert the moved list at the new position
      otherLists.splice(parsedInput.newPosition, 0, listToMove)

      // Update positions for all lists
      const updatePromises = otherLists.map((list, index) =>
        prisma.list.update({
          where: { id: list.id },
          data: { position: index }
        })
      )

      await prisma.$transaction(updatePromises)

      revalidatePath(`/b/${parsedInput.slug}`)

      return { success: true }
    } catch (error) {
      throw error
    }
  })
