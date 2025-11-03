'use server'

import BoardInviteEmail from '@/components/mail-templates/board-invite-mail'
import { protectedActionClient } from '@/lib/safe-action'
import prisma from '@/prisma/prisma'
import mailService from '@/services/mail.service'
import { NotFoundError } from '@/shared/error'
import { slugify } from '@/shared/utils'
import { render } from '@react-email/render'
import { flattenValidationErrors } from 'next-safe-action'
import { revalidatePath } from 'next/cache'
import { createBoardSchema, shareBoardSchema } from './validations'

export const createBoard = protectedActionClient
  .inputSchema(createBoardSchema, {
    handleValidationErrorsShape: async (ve) => flattenValidationErrors(ve).fieldErrors
  })
  .action(async ({ parsedInput, ctx }) => {
    try {
      const board = await prisma.board.create({
        data: {
          name: parsedInput.name,
          background: parsedInput.background,
          visibility: parsedInput.visibility,
          description: parsedInput.description,
          workspaceId: parsedInput.workspaceId,
          slug: slugify(parsedInput.name),
          ownerId: ctx.currentUser.id
        }
      })

      revalidatePath(`/w/${parsedInput.workspaceId}`)
      revalidatePath(`/`)

      return board
    } catch (error) {
      throw error
    }
  })

export const shareBoard = protectedActionClient
  .inputSchema(shareBoardSchema, {
    handleValidationErrorsShape: async (ve) => flattenValidationErrors(ve).fieldErrors
  })
  .action(async ({ parsedInput, ctx }) => {
    try {
      const { boardSlug, value, role, description } = parsedInput
      const { currentUser } = ctx

      const board = await prisma.board.findUnique({ where: { slug: boardSlug } })
      if (!board) {
        throw new NotFoundError('Board')
      }

      await prisma.boardMember.createMany({
        data: value.map((member) => ({
          boardId: board.id,
          userId: member.userId,
          role
        }))
      })

      const html = await render(
        BoardInviteEmail({
          inviterName: currentUser.fullName || 'Trello Clone',
          boardName: board.name,
          boardUrl: `http://localhost:3000/b/${board.slug}`,
          description:
            description || 'Tham gia cùng họ trên Trello để nắm bắt, sắp xếp và giải quyết việc cần làm ở mọi nơi.'
        })
      )

      await mailService.sendEmails({
        payload: {
          from: `${currentUser.fullName} <system@mail.dahn.work>`,
          to: value.map((member) => member.email),
          subject: `${currentUser.fullName} đã mời bạn vào bảng ${board.name}`,
          html
        }
      })

      revalidatePath(`/b/${board.slug}`)

      return { message: 'Bảng đã được chia sẻ thành công.' }
    } catch (error) {
      throw error
    }
  })
