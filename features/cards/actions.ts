'use server'

import { protectedActionClient } from '@/lib/safe-action'
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
    try {
      // Get all cards in the list ordered by position
      const cards = await prisma.card.findMany({
        where: {
          listId: parsedInput.listId
        },
        orderBy: {
          position: 'asc'
        }
      })

      // Find the card being moved
      const cardToMove = cards.find((card) => card.id === parsedInput.cardId)
      if (!cardToMove) {
        throw new Error('Card not found')
      }

      // Remove the card from its current position
      const otherCards = cards.filter((card) => card.id !== parsedInput.cardId)

      // Insert the card at the new position
      const reorderedCards = [
        ...otherCards.slice(0, parsedInput.newPosition),
        cardToMove,
        ...otherCards.slice(parsedInput.newPosition)
      ]

      // Update positions for all affected cards
      const updatePromises = reorderedCards.map((card, index) =>
        prisma.card.update({
          where: { id: card.id },
          data: { position: index }
        })
      )

      await Promise.all(updatePromises)

      revalidatePath(`/b/${parsedInput.slug}`)

      return { success: true }
    } catch (error) {
      throw error
    }
  })
