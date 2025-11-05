'use server'

import { inngest } from '@/lib/inngest/client'
import { protectedActionClient } from '@/lib/safe-action'
import prisma from '@/prisma/prisma'
import { POSITION_GAP } from '@/shared/constants'
import { BadRequestError, ConflictError, NotFoundError, UnauthorizedError } from '@/shared/error'
import { AssigneeDetails, CreateDetails, MoveDetails } from '@/shared/types'
import { getReminderDate, slugify } from '@/shared/utils'
import { ActivityAction, Prisma } from '@prisma/client/edge'
import { flattenValidationErrors } from 'next-safe-action'
import { revalidatePath } from 'next/cache'
import { permanentRedirect, RedirectType } from 'next/navigation'
import { checkBoardMemberPermission } from '../boards/queries'
import {
  createCardSchema,
  deleteCardDateSchema,
  moveCardBetweenListsSchema,
  moveCardWithinListSchema,
  toggleAssignCardSchema,
  toggleCompleteCardSchema,
  toggleWatchCardSchema,
  updateCardBackgroundSchema,
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
          id: parsedInput.listId,
          board: { slug: parsedInput.slug }
        },
        select: {
          id: true,
          name: true,
          board: { select: { slug: true } }
        }
      })

      if (!list) {
        throw new NotFoundError('List')
      }

      const canAccessBoard = await checkBoardMemberPermission(parsedInput.slug)

      if (!canAccessBoard) {
        throw new UnauthorizedError('Chỉ thành viên của bảng mới có thể thêm thẻ.')
      }

      const latestPosition = await prisma.card.findFirst({
        where: {
          listId: list.id
        },
        orderBy: {
          position: 'desc'
        }
      })
      const newPosition = latestPosition ? latestPosition.position + POSITION_GAP : 0

      const slugs = await prisma.card.findMany({
        where: {
          list: {
            board: {
              slug: parsedInput.slug
            }
          }
        }
      })

      const existingSlugs = new Set(slugs.map((s) => s.slug))

      const baseSlug = slugify(parsedInput.title)
      let candidate = baseSlug
      let counter = 1

      while (existingSlugs.has(candidate)) {
        candidate = `${baseSlug}-${counter++}`
      }

      const createCardDetails: CreateDetails = {
        nameSnapshot: list.name,
        initialValues: parsedInput
      }

      const [card] = await prisma.$transaction(async (tx) => {
        const card = await tx.card.create({
          data: {
            title: parsedInput.title,
            slug: candidate,
            listId: list.id,
            position: newPosition,
            creatorId: ctx.currentUser.id
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

        await inngest.send({
          name: 'app/card.created',
          data: {
            cardId: card.id,
            listId: list.id,
            boardSlug: list.board.slug,
            userId: ctx.currentUser.id
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

// Move card within list (dnd)
export const moveCardWithinList = protectedActionClient
  .inputSchema(moveCardWithinListSchema, {
    handleValidationErrorsShape: async (ve) => flattenValidationErrors(ve).fieldErrors
  })
  .action(async ({ parsedInput }) => {
    try {
      const canAccessBoard = await checkBoardMemberPermission(parsedInput.slug)

      if (!canAccessBoard) {
        throw new UnauthorizedError('Chỉ thành viên của bảng mới có thể di chuyển thẻ trong danh sách.')
      }

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

      // Calculate new position based on gap-based system
      let newPosition: number

      if (otherCards.length === 0) {
        newPosition = 0
      } else if (parsedInput.newPosition === 0) {
        // Moving to the near top
        newPosition = otherCards[0].position - POSITION_GAP
      } else if (parsedInput.newPosition >= otherCards.length) {
        // Moving to the end
        newPosition = otherCards[otherCards.length - 1].position + POSITION_GAP
      } else {
        // Moving between two cards
        const prevCard = otherCards[parsedInput.newPosition - 1]
        const nextCard = otherCards[parsedInput.newPosition]
        newPosition = Math.floor((prevCard.position + nextCard.position) / 2)
      }

      await prisma.card.update({
        where: { id: parsedInput.cardId },
        data: { position: newPosition }
      })

      revalidatePath(`/b/${parsedInput.slug}`)

      return { success: true }
    } catch (error) {
      throw error
    }
  })

// Move card between lists
export const moveCardBetweenLists = protectedActionClient
  .inputSchema(moveCardBetweenListsSchema, {
    handleValidationErrorsShape: async (ve) => flattenValidationErrors(ve).fieldErrors
  })
  .action(async ({ parsedInput, ctx }) => {
    try {
      const { cardId, sourceListId, targetListId, newPosition, slug } = parsedInput

      const canAccessBoard = await checkBoardMemberPermission(slug)

      if (!canAccessBoard) {
        throw new UnauthorizedError('Chỉ thành viên của bảng mới có thể di chuyển thẻ giữa danh sách.')
      }

      if (sourceListId === targetListId) {
        return
      }

      const [cardToMove, fromList, toList, targetListCards] = await Promise.all([
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
        })
      ])

      if (!cardToMove) throw new NotFoundError('Card')
      if (!fromList) throw new NotFoundError('Source list')
      if (!toList) throw new NotFoundError('Target list')

      if (newPosition < 0 || newPosition > targetListCards.length) {
        throw new BadRequestError(`Invalid position: ${newPosition}. Must be between 0 and ${targetListCards.length}`)
      }

      // Calculate new position based on gap-based system
      let calculatedPosition: number

      if (targetListCards.length === 0) {
        calculatedPosition = 0
      } else if (newPosition === 0) {
        // Moving to the near top
        calculatedPosition = targetListCards[0].position - POSITION_GAP
      } else if (newPosition >= targetListCards.length) {
        // Moving to the end
        calculatedPosition = targetListCards[targetListCards.length - 1].position + POSITION_GAP
      } else {
        // Moving between two cards
        const prevCard = targetListCards[newPosition - 1]
        const nextCard = targetListCards[newPosition]
        calculatedPosition = Math.floor((prevCard.position + nextCard.position) / 2)
      }

      await prisma.$transaction([
        prisma.card.update({
          where: { id: cardId },
          data: {
            listId: targetListId,
            position: calculatedPosition
          }
        }),
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
      const canAccessBoard = await checkBoardMemberPermission(parsedInput.boardSlug)

      if (!canAccessBoard) {
        throw new UnauthorizedError('Chỉ thành viên của bảng mới có thể cập nhật thẻ.')
      }

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
      const canAccessBoard = await checkBoardMemberPermission(parsedInput.boardSlug)

      if (!canAccessBoard) {
        throw new UnauthorizedError('Chỉ thành viên của bảng mới có thể cập nhật nhắc nhở thẻ.')
      }

      const startDate = parsedInput.parsedStartDate || null
      const endDate = parsedInput.parsedEndDateTime || null

      let reminderDate: Date | null = null
      if (endDate && parsedInput.reminderType !== 'NONE') {
        reminderDate = getReminderDate(endDate, parsedInput.reminderType)
      }

      const card = await prisma.card.findUnique({
        where: {
          slug: parsedInput.cardSlug,
          list: { board: { slug: parsedInput.boardSlug } }
        },
        include: {
          list: { select: { board: { select: { id: true, slug: true } } } },
          assignees: { select: { userId: true } },
          watchers: { select: { userId: true } }
        }
      })

      if (!card) {
        throw new NotFoundError('Card')
      }

      await prisma.card.update({
        where: { id: card.id },
        data: {
          startDate,
          endDate,
          reminderType: parsedInput.reminderType
        }
      })

      // Cancel existing reminder if any
      await inngest.send({
        name: 'card/reminder.cancelled',
        data: { cardId: card.id }
      })

      // Schedule new reminder if needed
      if (endDate && parsedInput.reminderType !== 'NONE' && reminderDate) {
        const recipientIds = Array.from(
          new Set([
            ...card.assignees.map((assignee) => assignee.userId),
            ...card.watchers.map((watcher) => watcher.userId)
          ])
        )

        if (recipientIds.length > 0) {
          try {
            await inngest.send({
              name: 'card/reminder.scheduled',
              data: { cardId: card.id }
            })
          } catch {
            throw new BadRequestError('Không thể tạo lịch nhắc nhở. Vui lòng thử lại.')
          }
        }
      }

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
      const canAccessBoard = await checkBoardMemberPermission(parsedInput.boardSlug)

      if (!canAccessBoard) {
        throw new UnauthorizedError('Chỉ thành viên của bảng mới có thể xóa nhắc nhở thẻ.')
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

      // Cancel any existing reminder
      await inngest.send({
        name: 'card/reminder.cancelled',
        data: { cardId: card.id }
      })

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

export const updateCardBackground = protectedActionClient
  .inputSchema(updateCardBackgroundSchema, {
    handleValidationErrorsShape: async (ve) => flattenValidationErrors(ve).fieldErrors
  })
  .action(async ({ parsedInput }) => {
    try {
      const canAccessBoard = await checkBoardMemberPermission(parsedInput.boardSlug)

      if (!canAccessBoard) {
        throw new UnauthorizedError('Chỉ thành viên của bảng mới có thể cập nhật nền thẻ.')
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

      await prisma.card.update({
        where: { id: card.id },
        data: {
          imageUrl: parsedInput.imageUrl
        }
      })

      revalidatePath(`/b/${parsedInput.boardSlug}/c/${parsedInput.cardSlug}`)

      return { message: 'Nền thẻ đã được cập nhật thành công.' }
    } catch (error) {
      throw error
    }
  })

export const toggleWatchCard = protectedActionClient
  .inputSchema(toggleWatchCardSchema, {
    handleValidationErrorsShape: async (ve) => flattenValidationErrors(ve).fieldErrors
  })
  .action(async ({ parsedInput, ctx }) => {
    try {
      const canAccessBoard = await checkBoardMemberPermission(parsedInput.boardSlug)

      if (!canAccessBoard) {
        throw new UnauthorizedError('Chỉ thành viên của bảng mới có thể theo dõi thẻ.')
      }

      const { boardSlug, cardSlug } = parsedInput
      const userId = ctx.currentUser.id

      const card = await prisma.card.findFirst({
        where: {
          slug: cardSlug,
          list: { board: { slug: boardSlug } }
        },
        select: {
          id: true,
          endDate: true,
          reminderType: true,
          assignees: { select: { userId: true } },
          watchers: { select: { userId: true } },
          list: { select: { board: { select: { id: true } } } }
        }
      })

      if (!card) throw new NotFoundError('Card')

      const result = await prisma.$transaction(async (tx) => {
        const existing = await tx.cardWatcher.findUnique({
          where: { cardId_userId: { cardId: card.id, userId } }
        })

        // Unwatch
        if (existing) {
          await tx.cardWatcher.delete({ where: { id: existing.id } })
          return { watching: false, shouldUpdateReminder: true }
        } else {
          // Watch
          await tx.cardWatcher.create({ data: { cardId: card.id, userId } })
          return { watching: true, shouldUpdateReminder: true }
        }
      })

      // Update reminder if card has one and user was added/removed
      if (result.shouldUpdateReminder && card.endDate && card.reminderType !== 'NONE') {
        // Cancel existing reminder
        await inngest.send({
          name: 'card/reminder.cancelled',
          data: { cardId: card.id }
        })

        // Get updated recipients (after watch/unwatch)
        const updatedCard = await prisma.card.findUnique({
          where: { id: card.id },
          select: {
            assignees: { select: { userId: true } },
            watchers: { select: { userId: true } }
          }
        })

        if (updatedCard) {
          const recipientIds = Array.from(
            new Set([
              ...updatedCard.assignees.map((assignee) => assignee.userId),
              ...updatedCard.watchers.map((watcher) => watcher.userId)
            ])
          )

          // Only reschedule if there are recipients
          if (recipientIds.length > 0) {
            await inngest.send({
              name: 'card/reminder.scheduled',
              data: { cardId: card.id }
            })
          }
        }
      }

      revalidatePath(`/b/${parsedInput.boardSlug}/c/${parsedInput.cardSlug}`)

      return {
        message: result.watching ? 'Bạn đã bắt đầu theo dõi thẻ.' : 'Bạn đã ngừng theo dõi thẻ.'
      }
    } catch (error) {
      console.error('Error toggling watch card:', error)
      throw error
    }
  })

export const toggleAssignCard = protectedActionClient
  .inputSchema(toggleAssignCardSchema, {
    handleValidationErrorsShape: async (ve) => flattenValidationErrors(ve).fieldErrors
  })
  .action(async ({ parsedInput, ctx }) => {
    try {
      const canAccessBoard = await checkBoardMemberPermission(parsedInput.boardSlug)

      if (!canAccessBoard) {
        throw new UnauthorizedError('Chỉ thành viên của bảng mới có thể cập nhật thành viên thẻ.')
      }

      const card = await prisma.card.findFirst({
        where: {
          slug: parsedInput.cardSlug,
          list: { board: { slug: parsedInput.boardSlug } }
        },
        select: {
          id: true,
          endDate: true,
          reminderType: true,
          assignees: { select: { userId: true } },
          watchers: { select: { userId: true } },
          list: {
            select: {
              board: {
                select: {
                  id: true,
                  owner: { select: { id: true, fullName: true, email: true } }
                }
              }
            }
          }
        }
      })

      if (!card) throw new NotFoundError('Card')

      const boardId = card.list.board.id
      const owner = card.list.board.owner

      const [actorMember, targetMember] = await Promise.all([
        prisma.boardMember.findFirst({
          where: { userId: ctx.currentUser.id, boardId },
          select: { user: { select: { id: true, fullName: true, email: true } } }
        }),
        prisma.boardMember.findFirst({
          where: { userId: parsedInput.targetId, boardId },
          select: { user: { select: { id: true, fullName: true, email: true } } }
        })
      ])

      const getUser = (member: typeof actorMember | null, fallback: typeof owner) => {
        if (member) return member.user
        if (ctx.currentUser.id === fallback.id || parsedInput.targetId === fallback.id) return fallback
        throw new UnauthorizedError('Chỉ thành viên của bảng mới có thể cập nhật thành viên thẻ.')
      }

      const actor = getUser(actorMember, owner)
      const target = getUser(targetMember, owner)

      const existing = await prisma.cardAssignee.findUnique({
        where: { cardId_userId: { cardId: card.id, userId: parsedInput.targetId } }
      })

      const details: AssigneeDetails = {
        actorId: actor.id,
        actorName: actor.fullName || actor.email.split('@')[0],
        targetId: target.id,
        targetName: target.fullName || target.email.split('@')[0]
      }

      const action: ActivityAction = existing ? 'UNASSIGN_MEMBER' : 'ASSIGN_MEMBER'

      await prisma.$transaction(async (tx) => {
        if (existing) {
          // Unassign
          await tx.cardAssignee.delete({ where: { id: existing.id } })
        } else {
          // Assign
          await tx.cardAssignee.create({
            data: { cardId: card.id, userId: parsedInput.targetId }
          })
        }

        await tx.activity.create({
          data: {
            cardId: card.id,
            userId: ctx.currentUser.id,
            model: 'CARD',
            action,
            details
          }
        })
      })

      // Update reminder if card has one
      if (card.endDate && card.reminderType !== 'NONE') {
        // Cancel existing reminder
        await inngest.send({
          name: 'card/reminder.cancelled',
          data: { cardId: card.id }
        })

        // Get updated recipients (after assign/unassign)
        const updatedCard = await prisma.card.findUnique({
          where: { id: card.id },
          select: {
            assignees: { select: { userId: true } },
            watchers: { select: { userId: true } }
          }
        })

        if (updatedCard) {
          const recipientIds = Array.from(
            new Set([
              ...updatedCard.assignees.map((assignee) => assignee.userId),
              ...updatedCard.watchers.map((watcher) => watcher.userId)
            ])
          )

          // Only reschedule if there are recipients
          if (recipientIds.length > 0) {
            await inngest.send({
              name: 'card/reminder.scheduled',
              data: { cardId: card.id }
            })
          }
        }
      }

      revalidatePath(`/b/${parsedInput.boardSlug}/c/${parsedInput.cardSlug}`)
      return { message: 'Thành viên đã được cập nhật thành công.' }
    } catch (error) {
      throw error
    }
  })

export const toggleCompleteCard = protectedActionClient
  .inputSchema(toggleCompleteCardSchema, {
    handleValidationErrorsShape: async (ve) => flattenValidationErrors(ve).fieldErrors
  })
  .action(async ({ parsedInput, ctx }) => {
    try {
      const canAccessBoard = await checkBoardMemberPermission(parsedInput.boardSlug)

      if (!canAccessBoard) {
        throw new UnauthorizedError('Chỉ thành viên của bảng mới có thể cập nhật trạng thái thẻ.')
      }

      const { cardSlug, boardSlug } = parsedInput

      const card = await prisma.card.findFirst({
        where: {
          slug: cardSlug,
          list: { board: { slug: boardSlug } }
        },
        select: {
          id: true,
          isCompleted: true
        }
      })

      if (!card) {
        throw new NotFoundError('Card')
      }

      await prisma.$transaction(async (tx) => {
        await tx.card.update({
          where: { id: card.id },
          data: { isCompleted: !card.isCompleted }
        })

        await inngest.send({
          name: 'app/card.status',
          data: {
            cardId: card.id,
            userId: ctx.currentUser.id
          }
        })
      })

      revalidatePath(`/b/${boardSlug}`)

      return { message: 'Thẻ đã được cập nhật thành công.' }
    } catch (error) {
      throw error
    }
  })
