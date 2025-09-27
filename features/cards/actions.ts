'use server'

import { protectedActionClient } from '@/lib/safe-action'
import { slugify } from '@/lib/utils'
import prisma from '@/prisma/prisma'
import { CardDetail, CardTimeline, CreateDetails, MoveDetails, TimelineItemType } from '@/types/common'
import { BadRequestError, ConflictError, NotFoundError } from '@/types/error'
import { Prisma } from '@prisma/client/edge'
import { parse } from 'date-fns'
import { flattenValidationErrors } from 'next-safe-action'
import { revalidatePath } from 'next/cache'
import { permanentRedirect, RedirectType } from 'next/navigation'
import {
  createCardSchema,
  deleteCardDateSchema,
  moveCardBetweenListsSchema,
  moveCardWithinListSchema,
  updateCardDateSchema,
  updateCardSchema
} from './validations'

// Create new card
export const createCard = protectedActionClient
  .inputSchema(createCardSchema, {
    handleValidationErrorsShape: async (ve) => flattenValidationErrors(ve).fieldErrors
  })
  .action(async ({ parsedInput, ctx }) => {
    try {
      const list = await prisma.list.findUnique({
        where: {
          id: parsedInput.listId
        }
      })

      if (!list) {
        throw new NotFoundError('List')
      }

      const latestPosition = await prisma.card.findFirst({
        where: {
          listId: list.id
        },
        orderBy: {
          position: 'desc'
        }
      })

      const createCardDetails: CreateDetails = {
        nameSnapshot: list.name,
        initialValues: parsedInput
      }

      const [card] = await prisma.$transaction(async (tx) => {
        const card = await tx.card.create({
          data: {
            title: parsedInput.title,
            slug: slugify(parsedInput.title),
            listId: list.id,
            position: (latestPosition?.position ?? -1) + 1
          }
        })

        await tx.activity.create({
          data: {
            userId: ctx.currentUser.id,
            model: 'CARD',
            action: 'CREATE',
            details: createCardDetails,
            cardId: card.id
          }
        })

        return [card]
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

// Get card detail
export const getCard = async (cardSlug: string): Promise<CardDetail> => {
  try {
    const card = await prisma.card.findUnique({
      where: {
        slug: cardSlug
      },
      include: {
        list: true,
        cardLabels: {
          where: {
            label: {
              isDeleted: false
            }
          },
          include: {
            label: true
          },
          orderBy: {
            updatedAt: 'asc'
          }
        },
        subtasks: {
          where: {
            parentId: null,
            isDeleted: false
          },
          orderBy: {
            createdAt: 'asc'
          },
          include: {
            children: {
              where: {
                isDeleted: false
              },
              orderBy: {
                createdAt: 'asc'
              }
            }
          }
        },
        assignees: {
          include: {
            user: true
          }
        },
        attachments: true,
        comments: true
      }
    })

    if (!card) {
      throw new NotFoundError('Card')
    }

    return card
  } catch (error) {
    throw error
  }
}

// Move card within list (dnd)
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

/**
 * Moves a card from one list to another with position management
 * Handles all position updates for affected cards in both source and target lists
 */
export const moveCardBetweenLists = protectedActionClient
  .inputSchema(moveCardBetweenListsSchema, {
    handleValidationErrorsShape: async (ve) => flattenValidationErrors(ve).fieldErrors
  })
  .action(async ({ parsedInput, ctx }) => {
    const { cardId, sourceListId, targetListId, newPosition, slug } = parsedInput

    if (sourceListId === targetListId) {
      return
    }

    const [cardToMove, fromList, toList, targetListCards, sourceListCards] = await Promise.all([
      prisma.card.findUnique({
        where: { id: cardId },
        select: { id: true, title: true, position: true, listId: true }
      }),
      prisma.list.findUnique({
        where: { id: sourceListId },
        select: { id: true, name: true }
      }),
      prisma.list.findUnique({
        where: { id: targetListId },
        select: { id: true, name: true }
      }),
      prisma.card.findMany({
        where: { listId: targetListId },
        select: { id: true, position: true },
        orderBy: { position: 'asc' }
      }),
      prisma.card.findMany({
        where: {
          listId: sourceListId,
          id: { not: cardId }
        },
        select: { id: true, position: true },
        orderBy: { position: 'asc' }
      })
    ])

    if (!cardToMove) throw new NotFoundError('Card')
    if (!fromList) throw new NotFoundError('Source list')
    if (!toList) throw new NotFoundError('Target list')

    if (newPosition < 0 || newPosition > targetListCards.length) {
      throw new BadRequestError(`Invalid position: ${newPosition}. Must be between 0 and ${targetListCards.length}`)
    }

    const updateOperations = []

    // Update the moved card
    updateOperations.push(
      prisma.card.update({
        where: { id: cardId },
        data: {
          listId: targetListId,
          position: newPosition
        }
      })
    )

    // Update positions in target list (shift cards at and after new position)
    const targetUpdates = targetListCards
      .filter((_, index) => index >= newPosition)
      .map((card, index) =>
        prisma.card.update({
          where: { id: card.id },
          data: { position: newPosition + index + 1 }
        })
      )

    // Update positions in source list (reindex remaining cards)
    const sourceUpdates = sourceListCards.map((card, index) =>
      prisma.card.update({
        where: { id: card.id },
        data: { position: index }
      })
    )

    updateOperations.push(...targetUpdates, ...sourceUpdates)

    await prisma.$transaction([
      ...updateOperations,
      prisma.activity.create({
        data: {
          userId: ctx.currentUser.id,
          model: 'CARD',
          action: 'MOVE',
          details: {
            fromListId: fromList.id,
            fromListName: fromList.name,
            toListId: toList.id,
            toListName: toList.name,
            position: newPosition
          } as MoveDetails,
          cardId
        }
      })
    ])

    revalidatePath(`/b/${slug}`)

    return { message: 'Thẻ đã được di chuyển thành công.' }
  })

// Update card title, description, slug
export const updateCard = protectedActionClient
  .inputSchema(updateCardSchema, {
    handleValidationErrorsShape: async (ve) => flattenValidationErrors(ve).fieldErrors
  })
  .action(async ({ parsedInput }) => {
    try {
      const card = await prisma.card.findUnique({
        where: { id: parsedInput.cardId },
        select: { title: true, slug: true }
      })

      if (!card) {
        throw new NotFoundError('Card')
      }

      let slug = card.slug

      if (parsedInput.title && parsedInput.title !== card.title) {
        // Create new slug (and ensure uniqueness)
        const baseSlug = slugify(parsedInput.title)
        let candidate = baseSlug
        let counter = 1

        while (
          await prisma.card.findFirst({
            where: { slug: candidate, NOT: { id: parsedInput.cardId } },
            select: { id: true }
          })
        ) {
          // Add counter to slug if it already exists
          candidate = `${baseSlug}-${counter++}`
        }
        slug = candidate
      }

      const data: {
        title?: string
        description?: string
        slug?: string
      } = {}

      if (parsedInput.title) {
        data.title = parsedInput.title
      }

      if (parsedInput.description !== undefined) {
        data.description = parsedInput.description
      }

      if (parsedInput.title) {
        data.slug = slug
      }

      const updatedCard = await prisma.card.update({
        where: { id: parsedInput.cardId },
        data,
        select: {
          id: true,
          title: true,
          slug: true,
          description: true,
          updatedAt: true
        }
      })

      revalidatePath(`/b/${parsedInput.boardSlug}/c/${updatedCard.slug}`)

      if (data.title) {
        permanentRedirect(`/b/${parsedInput.boardSlug}/c/${updatedCard.slug}`, RedirectType.replace)
      }

      return updatedCard
    } catch (error) {
      throw error
    }
  })

// Update card date
export const updateCardDate = protectedActionClient
  .inputSchema(updateCardDateSchema, {
    handleValidationErrorsShape: async (ve) => flattenValidationErrors(ve).fieldErrors
  })
  .action(async ({ parsedInput }) => {
    try {
      const board = await prisma.board.findUnique({
        where: { slug: parsedInput.boardSlug }
      })

      if (!board) {
        throw new NotFoundError('Board')
      }

      const card = await prisma.card.findUnique({
        where: { slug: parsedInput.cardSlug }
      })

      if (!card) {
        throw new NotFoundError('Card')
      }

      await prisma.card.update({
        where: { id: card.id },
        data: {
          startDate: parsedInput.startDate ? parse(parsedInput.startDate, 'MM/dd/yyyy', new Date()) : null,
          endDate: parsedInput.endDate
            ? parse(`${parsedInput.endDate} ${parsedInput.endTime}`, 'MM/dd/yyyy H:mm', new Date())
            : null,
          reminderType: parsedInput.reminderType
        }
      })

      revalidatePath(`/b/${parsedInput.boardSlug}/c/${parsedInput.cardSlug}`)

      return { message: 'Nhắc nhở đã được cập nhật thành công.' }
    } catch (error) {
      throw error
    }
  })

// Delete card date
export const deleteCardDate = protectedActionClient
  .inputSchema(deleteCardDateSchema, {
    handleValidationErrorsShape: async (ve) => flattenValidationErrors(ve).fieldErrors
  })
  .action(async ({ parsedInput }) => {
    try {
      const board = await prisma.board.findUnique({
        where: { slug: parsedInput.boardSlug }
      })

      if (!board) {
        throw new NotFoundError('Board')
      }

      const card = await prisma.card.findUnique({
        where: { slug: parsedInput.cardSlug }
      })

      if (!card) {
        throw new NotFoundError('Card')
      }

      await prisma.card.update({
        where: { id: card.id },
        data: {
          startDate: null,
          endDate: null,
          reminderType: 'NONE'
        }
      })

      revalidatePath(`/b/${parsedInput.boardSlug}/c/${parsedInput.cardSlug}`)

      return { message: 'Nhắc nhở đã được gỡ bỏ thành công.' }
    } catch (error) {
      throw error
    }
  })

export const getCardActivitiesAndComments = async (cardSlug: string): Promise<CardTimeline> => {
  try {
    const card = await prisma.card.findUnique({
      where: { slug: cardSlug }
    })

    if (!card) {
      throw new NotFoundError('Card')
    }

    const activities = (
      await prisma.activity.findMany({
        where: { cardId: card.id },
        orderBy: { createdAt: 'desc' },
        include: {
          user: true
        }
      })
    ).map((a) => ({ ...a, __type: TimelineItemType.Activity as const }))

    const comments = (
      await prisma.comment.findMany({
        where: { cardId: card.id, isDeleted: false },
        orderBy: { createdAt: 'desc' },
        include: {
          user: true
        }
      })
    ).map((c) => ({ ...c, __type: TimelineItemType.Comment as const }))

    const sortedList = [...activities, ...comments].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    return { activities, comments, sortedList }
  } catch (error) {
    throw error
  }
}
