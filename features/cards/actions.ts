'use server'

import { protectedActionClient } from '@/lib/safe-action'
import prisma from '@/prisma/prisma'
import { ConflictError, NotFoundError } from '@/types/error'
import { Prisma } from '@prisma/client/edge'
import { flattenValidationErrors } from 'next-safe-action'
import { revalidatePath } from 'next/cache'
import { createCardSchema, moveCardBetweenListsSchema, moveCardWithinListSchema } from './validations'

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
        throw new NotFoundError('Card')
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

      await prisma.$transaction(updatePromises)

      revalidatePath(`/b/${parsedInput.slug}`)

      return { success: true }
    } catch (error) {
      throw error
    }
  })

export const moveCardBetweenLists = protectedActionClient
  .inputSchema(moveCardBetweenListsSchema, {
    handleValidationErrorsShape: async (ve) => flattenValidationErrors(ve).fieldErrors
  })
  .action(async ({ parsedInput }) => {
    try {
      // Get the card to move
      const cardToMove = await prisma.card.findUnique({
        where: { id: parsedInput.cardId }
      })

      if (!cardToMove) {
        throw new NotFoundError('Card')
      }

      // Get all cards in the target list ordered by position
      const targetListCards = await prisma.card.findMany({
        where: {
          listId: parsedInput.targetListId
        },
        orderBy: {
          position: 'asc'
        }
      })

      // Get all cards in the source list (excluding the moved card) ordered by position
      const sourceListCards = await prisma.card.findMany({
        where: {
          listId: parsedInput.sourceListId,
          id: { not: parsedInput.cardId }
        },
        orderBy: {
          position: 'asc'
        }
      })

      // Insert the card at the new position in target list
      const updatedTargetCards = [
        ...targetListCards.slice(0, parsedInput.newPosition),
        cardToMove,
        ...targetListCards.slice(parsedInput.newPosition)
      ]

      // Create update promises for all affected cards
      const updatePromises = []

      // Update the moved card's listId and position
      updatePromises.push(
        prisma.card.update({
          where: { id: parsedInput.cardId },
          data: {
            listId: parsedInput.targetListId,
            position: parsedInput.newPosition
          }
        })
      )

      // Update positions in target list
      updatedTargetCards.forEach((card, index) => {
        if (card.id !== parsedInput.cardId) {
          updatePromises.push(
            prisma.card.update({
              where: { id: card.id },
              data: { position: index }
            })
          )
        }
      })

      // Update positions in source list
      sourceListCards.forEach((card, index) => {
        updatePromises.push(
          prisma.card.update({
            where: { id: card.id },
            data: { position: index }
          })
        )
      })

      await prisma.$transaction(updatePromises)

      revalidatePath(`/b/${parsedInput.slug}`)

      return { success: true }
    } catch (error) {
      throw error
    }
  })
