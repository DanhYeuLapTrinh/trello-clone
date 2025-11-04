'use server'

import { protectedActionClient } from '@/lib/safe-action'
import prisma from '@/prisma/prisma'
import firebaseService from '@/services/firebase.service'
import { ConflictError, NotFoundError, UnauthorizedError } from '@/shared/error'
import { Prisma } from '@prisma/client/edge'
import { flattenValidationErrors } from 'next-safe-action'
import { revalidatePath } from 'next/cache'
import { checkBoardMemberPermission } from '../boards/queries'
import { getWebsiteName } from './utils'
import { addAttachmentSchema, deleteAttachmentSchema, updateAttachmentSchema } from './validations'

export const addAttachment = protectedActionClient
  .inputSchema(addAttachmentSchema, {
    handleValidationErrorsShape: async (ve) => flattenValidationErrors(ve).fieldErrors
  })
  .action(async ({ parsedInput }) => {
    try {
      const canAccessBoard = await checkBoardMemberPermission(parsedInput.boardSlug)

      if (!canAccessBoard) {
        throw new UnauthorizedError('Chỉ thành viên của bảng mới có thể thêm đính kèm.')
      }

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

      await prisma.attachment.create({
        data: {
          fileName: parsedInput.fileName || getWebsiteName(parsedInput.url),
          fileType: parsedInput.fileType,
          url: parsedInput.url,
          cardId: card.id
        }
      })

      revalidatePath(`/b/${parsedInput.boardSlug}/c/${parsedInput.cardSlug}`)

      return { message: 'Đính kèm đã được thêm thành công.' }
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictError('Tên danh sách đã tồn tại.')
      }
      throw error
    }
  })

export const deleteAttachment = protectedActionClient
  .inputSchema(deleteAttachmentSchema, {
    handleValidationErrorsShape: async (ve) => flattenValidationErrors(ve).fieldErrors
  })
  .action(async ({ parsedInput }) => {
    try {
      const canAccessBoard = await checkBoardMemberPermission(parsedInput.boardSlug)

      if (!canAccessBoard) {
        throw new UnauthorizedError('Chỉ có thành viên của bảng mới có thể xóa đính kèm.')
      }

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

      if (parsedInput.fileType === 'href') {
        await prisma.attachment.update({
          where: { id: parsedInput.attachmentId },
          data: {
            isDeleted: true
          }
        })
      } else {
        await prisma.attachment.update({
          where: { id: parsedInput.attachmentId },
          data: {
            isDeleted: true
          }
        })
        await firebaseService.deleteFile(firebaseService.extractFilePathFromUrl(parsedInput.url))
      }

      revalidatePath(`/b/${parsedInput.boardSlug}/c/${parsedInput.cardSlug}`)

      return { message: 'Đính kèm đã được xóa thành công.' }
    } catch (error) {
      throw error
    }
  })

export const updateAttachment = protectedActionClient
  .inputSchema(updateAttachmentSchema, {
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

      if (parsedInput.fileType === 'href') {
        await prisma.attachment.update({
          where: { id: parsedInput.attachmentId },
          data: {
            fileName: parsedInput.fileName || getWebsiteName(parsedInput.url),
            url: parsedInput.url
          }
        })
      } else {
        await prisma.attachment.update({
          where: { id: parsedInput.attachmentId },
          data: {
            fileName: parsedInput.fileName || getWebsiteName(parsedInput.url)
          }
        })
      }

      revalidatePath(`/b/${parsedInput.boardSlug}/c/${parsedInput.cardSlug}`)

      return { message: 'Đính kèm đã được cập nhật thành công.' }
    } catch (error) {
      throw error
    }
  })
