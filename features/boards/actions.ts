'use server'

import BoardInviteEmail from '@/components/mail-templates/board-invite-mail'
import { protectedActionClient } from '@/lib/safe-action'
import prisma from '@/prisma/prisma'
import mailService from '@/services/mail.service'
import { NotFoundError, UnauthorizedError } from '@/shared/error'
import { slugify } from '@/shared/utils'
import { render } from '@react-email/render'
import { flattenValidationErrors } from 'next-safe-action'
import { revalidatePath } from 'next/cache'
import { checkWorkspacePermission } from '../workspaces/queries'
import { checkBoardPermission } from './queries'
import { createBoardSchema, shareBoardSchema } from './validations'

export const createBoard = protectedActionClient
  .inputSchema(createBoardSchema, {
    handleValidationErrorsShape: async (ve) => flattenValidationErrors(ve).fieldErrors
  })
  .action(async ({ parsedInput, ctx }) => {
    try {
      const canCreateBoard = await checkWorkspacePermission(parsedInput.workspaceId)

      if (!canCreateBoard) {
        throw new UnauthorizedError('Bạn không có quyền tạo bảng.')
      }

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

      const canShareBoard = await checkBoardPermission(boardSlug)

      if (!canShareBoard) {
        throw new UnauthorizedError('Bạn không có quyền chia sẻ bảng này.')
      }

      const existingMembers = await prisma.boardMember.findMany({
        where: {
          boardId: board.id,
          userId: { in: value.map((member) => member.userId) }
        }
      })

      const newMembers = value.filter((member) => !existingMembers.some((m) => m.userId === member.userId))

      await prisma.boardMember.createMany({
        data: newMembers.map((member) => ({
          boardId: board.id,
          userId: member.userId,
          role
        }))
      })

      const html = await render(
        BoardInviteEmail({
          inviterName: currentUser.fullName || 'Trello Clone',
          boardName: board.name,
          boardUrl: `${process.env.APP_URL}/b/${board.slug}`,
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
