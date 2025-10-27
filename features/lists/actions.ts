'use server'

import { POSITION_GAP } from '@/lib/constants'
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

      // Get all lists in the board ordered by position (excluding the one being moved)
      const otherLists = await prisma.list.findMany({
        where: {
          boardId: listToMove.boardId,
          id: { not: parsedInput.listId }
        },
        orderBy: { position: 'asc' }
      })

      let newPosition: number

      if (otherLists.length === 0) {
        // Only list in the board
        newPosition = 0
      } else if (parsedInput.newPosition === 0) {
        // Moving to the near top
        newPosition = otherLists[0].position - POSITION_GAP
      } else if (parsedInput.newPosition >= otherLists.length) {
        // Moving to the end
        newPosition = otherLists[otherLists.length - 1].position + POSITION_GAP
      } else {
        // Moving between two lists
        const prevList = otherLists[parsedInput.newPosition - 1]
        const nextList = otherLists[parsedInput.newPosition]
        newPosition = Math.floor((prevList.position + nextList.position) / 2)
      }

      await prisma.list.update({
        where: { id: parsedInput.listId },
        data: { position: newPosition }
      })

      revalidatePath(`/b/${parsedInput.slug}`)

      return { success: true }
    } catch (error) {
      throw error
    }
  })
