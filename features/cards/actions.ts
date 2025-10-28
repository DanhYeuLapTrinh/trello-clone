'use server'

import { POSITION_GAP } from '@/lib/constants'
import { inngest } from '@/lib/inngest/client'
import { cardReminderJob } from '@/lib/jobs/handlers'
import { CardReminderSchema } from '@/lib/jobs/validations'
import { protectedActionClient } from '@/lib/safe-action'
import { getReminderDate, slugify, toUnixSeconds } from '@/lib/utils'
import prisma from '@/prisma/prisma'
import jobService from '@/services/job.service'
import { AssigneeDetails, CardDetail, CardTimeline, CreateDetails, MoveDetails, TimelineItemType } from '@/types/common'
import { BadRequestError, ConflictError, NotFoundError, UnauthorizedError } from '@/types/error'
import { ActivityAction, Prisma } from '@prisma/client/edge'
import { flattenValidationErrors } from 'next-safe-action'
import { revalidatePath } from 'next/cache'
import { permanentRedirect, RedirectType } from 'next/navigation'
import { getMe } from '../users/actions'
import {
  createCardSchema,
  deleteCardDateSchema,
  moveCardBetweenListsSchema,
  moveCardWithinListSchema,
  toggleAssignCardSchema,
  toggleWatchCardSchema,
  updateCardBackgroundSchema,
  updateCardDateSchema,
  updateCardSchema
} from './validations'

// Updates recipients in an existing reminder job by deleting the old job and creating a new one
async function updateReminderJobRecipients(messageId: string, newRecipients: string[]): Promise<string | null> {
  const message = await jobService.getJob(messageId)

  if (message && message.body && message.notBefore) {
    const typedMessageBody = JSON.parse(JSON.parse(message.body)) as { payload: CardReminderSchema }

    await jobService.safeDeleteJob(messageId)

    if (newRecipients.length > 0) {
      const jobResult = await cardReminderJob.dispatch(
        {
          ...typedMessageBody.payload,
          recipients: newRecipients
        },
        {
          notBefore: message.notBefore / 1000
        }
      )
      return Array.isArray(jobResult) ? jobResult[0].messageId : jobResult.messageId
    }

    return null
  }

  return null
}

// Creates a new reminder job for a card
async function createCardReminderJob(params: {
  boardId: string
  cardId: string
  endDate: Date
  reminderType: CardReminderSchema['reminderType']
  recipientIds: string[]
}): Promise<string | null> {
  const { boardId, cardId, endDate, reminderType, recipientIds } = params

  if (reminderType === 'NONE' || recipientIds.length === 0) {
    return null
  }

  // FIXME: upstash current limit quota is 604800 (7 days max in the future for notBefore)
  const reminderDate = getReminderDate(endDate, reminderType)

  if (reminderDate <= new Date()) {
    return null
  }

  const jobResult = await cardReminderJob.dispatch(
    {
      boardId,
      cardId,
      endDate: endDate.toISOString(),
      reminderType,
      reminderDate: reminderDate.toISOString(),
      recipients: recipientIds
    },
    { notBefore: toUnixSeconds(reminderDate) }
  )

  return Array.isArray(jobResult) ? jobResult[0].messageId : jobResult.messageId
}

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

      const latestPosition = await prisma.card.findFirst({
        where: {
          listId: list.id
        },
        orderBy: {
          position: 'desc'
        }
      })
      const newPosition = latestPosition ? latestPosition.position + POSITION_GAP : 0

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

// Get card detail
export const getCard = async (cardSlug: string): Promise<CardDetail> => {
  try {
    const { id: userId } = await getMe()

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
          where: {
            user: {
              isDeleted: false
            }
          },
          select: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                imageUrl: true
              }
            }
          }
        },
        watchers: {
          where: {
            user: {
              isDeleted: false,
              id: userId
            }
          },
          include: {
            user: true
          }
        },
        attachments: {
          where: {
            isDeleted: false
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
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
    const { cardId, sourceListId, targetListId, newPosition, slug } = parsedInput

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

      const board = card.list.board

      let newMessageId: string | null = null

      if (card.messageId) {
        await jobService.safeDeleteJob(card.messageId)
      }

      // Create new reminder job if needed
      if (endDate && parsedInput.reminderType !== 'NONE' && reminderDate) {
        try {
          const recipientIds = Array.from(
            new Set([
              ...card.assignees.map((assignee) => assignee.userId),
              ...card.watchers.map((watcher) => watcher.userId)
            ])
          )

          newMessageId = await createCardReminderJob({
            boardId: board.id,
            cardId: card.id,
            endDate,
            reminderType: parsedInput.reminderType,
            recipientIds
          })
        } catch {
          throw new BadRequestError('Không thể tạo lịch nhắc nhở. Vui lòng thử lại.')
        }
      }

      await prisma.card.update({
        where: { id: card.id },
        data: {
          startDate,
          endDate,
          reminderType: parsedInput.reminderType,
          messageId: newMessageId
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

      if (card.messageId) {
        await jobService.safeDeleteJob(card.messageId)
      }

      await prisma.card.update({
        where: { id: card.id },
        data: {
          startDate: null,
          endDate: null,
          reminderType: 'NONE',
          messageId: null
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

export const updateCardBackground = protectedActionClient
  .inputSchema(updateCardBackgroundSchema, {
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
      const { boardSlug, cardSlug } = parsedInput
      const userId = ctx.currentUser.id

      const card = await prisma.card.findFirst({
        where: {
          slug: cardSlug,
          list: { board: { slug: boardSlug } }
        },
        select: {
          id: true,
          messageId: true,
          endDate: true,
          reminderType: true,
          assignees: { select: { userId: true } },
          watchers: { select: { userId: true } },
          list: { select: { board: { select: { id: true } } } }
        }
      })

      if (!card) throw new NotFoundError('Card')

      let messageId = card.messageId

      const result = await prisma.$transaction(async (tx) => {
        const existing = await tx.cardWatcher.findUnique({
          where: { cardId_userId: { cardId: card.id, userId } }
        })

        // Unwatch
        if (existing) {
          await tx.cardWatcher.delete({ where: { id: existing.id } })

          if (messageId) {
            const message = await jobService.getJob(messageId)

            // If message exists and is still in CREATED status, we can update the recipients
            if (message && message.body && message.notBefore) {
              const typedMessageBody = JSON.parse(JSON.parse(message.body)) as { payload: CardReminderSchema }

              // Only remove user from recipients if they're also NOT assigned
              const isAssigned = card.assignees.some((assignee) => assignee.userId === userId)

              if (!isAssigned) {
                // User is no longer watching AND not assigned - remove from recipients
                const newRecipients = typedMessageBody.payload.recipients.filter((recipient) => recipient !== userId)
                messageId = await updateReminderJobRecipients(messageId, newRecipients)
              }
              // else: User is still assigned, no need to update job
            } else {
              // Job has been delivered/cancelled, clear the messageId
              messageId = null
            }
          }

          return { watching: false }
        } else {
          // Watch
          await tx.cardWatcher.create({ data: { cardId: card.id, userId } })

          if (messageId) {
            const message = await jobService.getJob(messageId)

            if (message && message.body && message.notBefore) {
              const typedMessageBody = JSON.parse(JSON.parse(message.body)) as { payload: CardReminderSchema }

              // Only add user to recipients if they're not already in it
              if (!typedMessageBody.payload.recipients.includes(userId)) {
                const newRecipients = [...typedMessageBody.payload.recipients, userId]
                messageId = await updateReminderJobRecipients(messageId, newRecipients)
              }
              // else: User already in recipients (was assigned), no need to update job
            } else {
              // Job has been delivered/cancelled, clear the messageId
              messageId = null
            }
          } else {
            // No job exists yet -> create new one if card has a reminder
            if (card.endDate && card.reminderType !== 'NONE') {
              const recipientIds = Array.from(new Set([...card.watchers.map((watcher) => watcher.userId), userId]))

              messageId = await createCardReminderJob({
                boardId: card.list.board.id,
                cardId: card.id,
                endDate: card.endDate,
                reminderType: card.reminderType,
                recipientIds
              })
            }
          }

          return { watching: true }
        }
      })

      if (messageId !== card.messageId) {
        await prisma.card.update({
          where: { id: card.id },
          data: { messageId }
        })
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
      const card = await prisma.card.findFirst({
        where: {
          slug: parsedInput.cardSlug,
          list: { board: { slug: parsedInput.boardSlug } }
        },
        select: {
          id: true,
          messageId: true,
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
        throw new UnauthorizedError('Bạn không phải là thành viên của bảng này.')
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

      let messageId = card.messageId

      await prisma.$transaction(async (tx) => {
        if (existing) {
          // Unassign
          await tx.cardAssignee.delete({ where: { id: existing.id } })

          // Update reminder job recipients if exists
          if (messageId) {
            const message = await jobService.getJob(messageId)

            if (message && message.body && message.notBefore) {
              const typedMessageBody = JSON.parse(JSON.parse(message.body)) as { payload: CardReminderSchema }

              // Only remove user from recipients if they're also NOT watching
              const isWatching = card.watchers.some((watcher) => watcher.userId === parsedInput.targetId)

              if (!isWatching) {
                // User is no longer assigned AND not watching - remove from recipients
                const newRecipients = typedMessageBody.payload.recipients.filter(
                  (recipient) => recipient !== parsedInput.targetId
                )
                messageId = await updateReminderJobRecipients(messageId, newRecipients)
              }
              // else: User is still watching, no need to update job
            } else {
              // Job has been delivered/cancelled, clear the messageId
              messageId = null
            }
          }
        } else {
          // Assign
          await tx.cardAssignee.create({
            data: { cardId: card.id, userId: parsedInput.targetId }
          })

          // Update reminder job recipients if exists
          if (messageId) {
            const message = await jobService.getJob(messageId)

            if (message && message.body && message.notBefore) {
              const typedMessageBody = JSON.parse(JSON.parse(message.body)) as { payload: CardReminderSchema }

              // Only add user to recipients if they're not already in it
              if (!typedMessageBody.payload.recipients.includes(parsedInput.targetId)) {
                const newRecipients = [...typedMessageBody.payload.recipients, parsedInput.targetId]
                messageId = await updateReminderJobRecipients(messageId, newRecipients)
              }
              // else: User already in recipients (was watching), no need to update job
            } else {
              // Job has been delivered/cancelled, clear the messageId
              messageId = null
            }
          } else {
            // No job exists yet -> create new one if card has a reminder
            if (card.endDate && card.reminderType !== 'NONE') {
              const recipientIds = Array.from(
                new Set([
                  ...card.assignees.map((assignee) => assignee.userId),
                  ...card.watchers.map((watcher) => watcher.userId),
                  parsedInput.targetId
                ])
              )

              messageId = await createCardReminderJob({
                boardId,
                cardId: card.id,
                endDate: card.endDate,
                reminderType: card.reminderType,
                recipientIds
              })
            }
          }
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

      if (messageId !== card.messageId) {
        await prisma.card.update({
          where: { id: card.id },
          data: { messageId }
        })
      }

      revalidatePath(`/b/${parsedInput.boardSlug}/c/${parsedInput.cardSlug}`)
      return { message: 'Thành viên đã được cập nhật thành công.' }
    } catch (error) {
      throw error
    }
  })
