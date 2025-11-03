'use server'

import { protectedActionClient } from '@/lib/safe-action'
import prisma from '@/prisma/prisma'
import { NotFoundError } from '@/shared/error'
import { flattenValidationErrors } from 'next-safe-action'
import { revalidatePath } from 'next/cache'
import { createSubtaskSchema, deleteSubtaskSchema, updateSingleTaskSchema } from './validations'

// Create subtask to card
export const createSubtask = protectedActionClient
  .inputSchema(createSubtaskSchema, {
    handleValidationErrorsShape: async (ve) => flattenValidationErrors(ve).fieldErrors
  })
  .action(async ({ parsedInput }) => {
    const card = await prisma.card.findUnique({
      where: { slug: parsedInput.cardSlug },
      select: { id: true }
    })

    if (!card) {
      throw new NotFoundError('Card')
    }

    const subtask = await prisma.subtask.create({
      data: {
        title: parsedInput.title,
        cardId: card.id,
        parentId: parsedInput.parentId ?? null
      }
    })

    revalidatePath(`/b/${parsedInput.boardSlug}/c/${parsedInput.cardSlug}`)

    return subtask
  })

// Update single subtask completion status
export const updateSingleTask = protectedActionClient
  .inputSchema(updateSingleTaskSchema, {
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

      // Verify the task belongs to this card and is a child (not parent)
      const task = await prisma.subtask.findFirst({
        where: {
          id: parsedInput.taskId,
          cardId: card.id,
          parentId: { not: null },
          isDeleted: false
        }
      })

      if (!task) {
        throw new NotFoundError('Task not found or is not a child task')
      }

      const updatedTask = await prisma.subtask.update({
        where: { id: parsedInput.taskId },
        data: { isDone: parsedInput.isDone }
      })

      revalidatePath(`/b/${parsedInput.boardSlug}/c/${parsedInput.cardSlug}`)

      return {
        message: 'Trạng thái việc cần làm đã được cập nhật thành công',
        task: updatedTask
      }
    } catch (error) {
      throw error
    }
  })

export const deleteSubtask = protectedActionClient
  .inputSchema(deleteSubtaskSchema, {
    handleValidationErrorsShape: async (ve) => flattenValidationErrors(ve).fieldErrors
  })
  .action(async ({ parsedInput }) => {
    try {
      const subtask = await prisma.subtask.findUnique({
        where: { id: parsedInput.subtaskId }
      })

      if (!subtask) {
        throw new NotFoundError('Subtask')
      }

      if (subtask.parentId) {
        await prisma.subtask.update({
          where: { id: subtask.id },
          data: { isDeleted: true }
        })
      } else {
        await prisma.subtask.updateMany({
          where: {
            OR: [{ id: subtask.id }, { parentId: subtask.id }]
          },
          data: { isDeleted: true }
        })
      }

      revalidatePath(`/b/${parsedInput.boardSlug}/c/${parsedInput.cardSlug}`)

      return { message: 'Subtask đã được xóa thành công' }
    } catch (error) {
      throw error
    }
  })
