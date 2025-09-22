'use server'

import { protectedActionClient } from '@/lib/safe-action'
import { slugify } from '@/lib/utils'
import prisma from '@/prisma/prisma'
import { CardDetail } from '@/types/common'
import { ConflictError, NotFoundError } from '@/types/error'
import { Label, Prisma } from '@prisma/client/edge'
import { flattenValidationErrors } from 'next-safe-action'
import { revalidatePath } from 'next/cache'
import { permanentRedirect, RedirectType } from 'next/navigation'
import {
  assignLabelSchema,
  createCardSchema,
  createLabelSchema,
  moveCardBetweenListsSchema,
  moveCardWithinListSchema,
  unassignLabelSchema,
  updateCardSchema
} from './validations'

// Create new card
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
          slug: slugify(parsedInput.title),
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
          include: {
            label: true
          },
          orderBy: {
            label: {
              color: 'asc'
            }
          }
        },
        subtasks: true,
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

// Move card between lists (dnd)
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

      console.log(data)

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

// Create and assign new label to card
export const createLabel = protectedActionClient
  .inputSchema(createLabelSchema, {
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

      const card = await prisma.card.findUnique({
        where: {
          slug: parsedInput.cardSlug
        }
      })

      if (!card) {
        throw new NotFoundError('Card')
      }

      const duplicateLabel = await prisma.label.findFirst({
        where: {
          OR: [{ title: parsedInput.title }, { color: parsedInput.color }],
          boardId: board.id
        }
      })

      let label

      if (duplicateLabel) {
        // Update existing label and ensure it's connected to the card
        label = await prisma.label.update({
          where: {
            id: duplicateLabel.id
          },
          data: {
            title: parsedInput.title,
            color: parsedInput.color,
            cardLabels: {
              connectOrCreate: {
                where: {
                  cardId_labelId: {
                    cardId: card.id,
                    labelId: duplicateLabel.id
                  }
                },
                create: {
                  cardId: card.id
                }
              }
            }
          }
        })
      } else {
        // Create new label
        label = await prisma.label.create({
          data: {
            title: parsedInput.title,
            boardId: board.id,
            color: parsedInput.color,
            cardLabels: {
              create: {
                cardId: card.id
              }
            }
          }
        })
      }

      revalidatePath(`/b/${parsedInput.boardSlug}/c/${parsedInput.cardSlug}`)

      return label
    } catch (error) {
      throw error
    }
  })

export const getBoardLabels = async (slug: string): Promise<Label[]> => {
  try {
    const labels = await prisma.label.findMany({
      where: { board: { slug } },
      orderBy: {
        color: 'asc'
      }
    })

    return labels
  } catch (error) {
    throw error
  }
}

// Assign label to card
export const assignLabel = protectedActionClient
  .inputSchema(assignLabelSchema, {
    handleValidationErrorsShape: async (ve) => flattenValidationErrors(ve).fieldErrors
  })
  .action(async ({ parsedInput }) => {
    try {
      const card = await prisma.card.findUnique({
        where: {
          slug: parsedInput.cardSlug
        }
      })

      if (!card) {
        throw new NotFoundError('Card')
      }

      await prisma.cardLabel.create({
        data: {
          cardId: card.id,
          labelId: parsedInput.labelId
        }
      })

      revalidatePath(`/b/${parsedInput.boardSlug}/c/${parsedInput.cardSlug}`)

      return { message: 'Label đã được gán thành công' }
    } catch (error) {
      throw error
    }
  })

// Unassign label from card
export const unassignLabel = protectedActionClient
  .inputSchema(unassignLabelSchema, {
    handleValidationErrorsShape: async (ve) => flattenValidationErrors(ve).fieldErrors
  })
  .action(async ({ parsedInput }) => {
    try {
      const card = await prisma.card.findUnique({
        where: {
          slug: parsedInput.cardSlug
        }
      })

      if (!card) {
        throw new NotFoundError('Card')
      }

      await prisma.cardLabel.delete({
        where: {
          cardId_labelId: {
            cardId: card.id,
            labelId: parsedInput.labelId
          }
        }
      })

      revalidatePath(`/b/${parsedInput.boardSlug}/c/${parsedInput.cardSlug}`)

      return { message: 'Label đã được gỡ bỏ thành công' }
    } catch (error) {
      throw error
    }
  })
