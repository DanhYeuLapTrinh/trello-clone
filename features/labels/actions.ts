'use server'

import { protectedActionClient } from '@/lib/safe-action'
import prisma from '@/prisma/prisma'
import { NotFoundError } from '@/shared/error'
import { flattenValidationErrors } from 'next-safe-action'
import { revalidatePath } from 'next/cache'
import {
  assignLabelSchema,
  createLabelSchema,
  deleteLabelSchema,
  unassignLabelSchema,
  updateLabelSchema
} from './validations'

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

      const duplicatedLabel = await prisma.label.findFirst({
        where: {
          OR: [{ title: parsedInput.title }, { color: parsedInput.color }],
          boardId: board.id,
          isDeleted: false
        }
      })

      let label

      if (duplicatedLabel) {
        label = await prisma.label.update({
          where: {
            id: duplicatedLabel.id
          },
          data: {
            title: parsedInput.title,
            color: parsedInput.color
          }
        })
      } else {
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

export const updateLabel = protectedActionClient
  .inputSchema(updateLabelSchema, {
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

      const duplicatedLabel = await prisma.label.findFirst({
        where: {
          OR: [{ title: parsedInput.title }, { color: parsedInput.color }],
          boardId: board.id,
          isDeleted: false
        }
      })

      if (duplicatedLabel) {
        await prisma.label.update({
          where: { id: duplicatedLabel.id },
          data: {
            title: parsedInput.title,
            color: parsedInput.color
          }
        })
      } else {
        const data: { title?: string; color?: string } = {}

        if (parsedInput.title !== undefined) data.title = parsedInput.title
        if (parsedInput.color !== undefined) data.color = parsedInput.color

        if (Object.keys(data).length > 0) {
          await prisma.label.update({
            where: { id: parsedInput.labelId },
            data
          })
        }
      }

      revalidatePath(`/b/${parsedInput.boardSlug}/c/${parsedInput.cardSlug}`)

      return { message: 'Label đã được cập nhật thành công' }
    } catch (error) {
      throw error
    }
  })

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

export const deleteLabel = protectedActionClient
  .inputSchema(deleteLabelSchema, {
    handleValidationErrorsShape: async (ve) => flattenValidationErrors(ve).fieldErrors
  })
  .action(async ({ parsedInput }) => {
    try {
      await prisma.label.update({
        where: { id: parsedInput.labelId },
        data: { isDeleted: true }
      })

      await prisma.cardLabel.deleteMany({
        where: {
          labelId: parsedInput.labelId
        }
      })

      revalidatePath(`/b/${parsedInput.boardSlug}/c/${parsedInput.cardSlug}`)

      return { message: 'Label đã được xóa thành công' }
    } catch (error) {
      throw error
    }
  })
