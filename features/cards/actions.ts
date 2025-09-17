'use server'

import { protectedActionClient } from '@/lib/safe-action'
import { arrayMove } from '@/lib/utils'
import prisma from '@/prisma/prisma'
import { ConflictError } from '@/types/error'
import { Prisma } from '@prisma/client/edge'
import { flattenValidationErrors } from 'next-safe-action'
import { revalidatePath } from 'next/cache'
import { createCardSchema, moveCardWithinListSchema } from './validations'

export const createCard = protectedActionClient
  .inputSchema(createCardSchema, {
    handleValidationErrorsShape: async (ve) => flattenValidationErrors(ve).fieldErrors
  })
  .action(async ({ parsedInput }) => {
    try {
      const latestPosition = await prisma.card.findFirst({
        where: {
          listId: parsedInput.listId
        },
        orderBy: {
          position: 'desc'
        }
      })

      const card = await prisma.card.create({
        data: {
          title: parsedInput.title,
          listId: parsedInput.listId,
          position: (latestPosition?.position ?? -1) + 1
        }
      })

      revalidatePath(`/b/${parsedInput.slug}`)

      return card
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictError('Tên thẻ đã tồn tại.')
      }
      throw error
    }
  })

export const moveCardWithinList = protectedActionClient
  .inputSchema(moveCardWithinListSchema, {
    handleValidationErrorsShape: async (ve) => flattenValidationErrors(ve).fieldErrors
  })
  .action(async ({ parsedInput }) => {
    debugger
    const { listId, activeCardId, overCardId, slug } = parsedInput

    try {
      // If activeId === overId, do nothing
      if (activeCardId === overCardId) {
        return
      }

      const cards = await prisma.card.findMany({
        where: { listId },
        orderBy: { position: 'asc' }
      })

      const oldIndex = cards.findIndex((c) => c.id === activeCardId)
      const newIndex = cards.findIndex((c) => c.id === overCardId)

      if (oldIndex < 0 || newIndex < 0) {
        return
      }

      const reordered = arrayMove(cards, oldIndex, newIndex)

      await prisma.$transaction(
        reordered.map((card, index) =>
          prisma.card.update({
            where: { id: card.id },
            data: { position: index }
          })
        )
      )

      revalidatePath(`/b/${slug}`)

      return { success: true }
    } catch (error) {
      console.error(error)
      throw error
    }
  })
