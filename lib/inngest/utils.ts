import 'server-only'

import {
  ByOption,
  MemberAssignmentOption,
  MoveCardActionOption,
  PositionOption,
  StatusOption
} from '@/features/butlers/types'
import { ActionSchema } from '@/features/butlers/validations/server'
import prisma from '@/prisma/prisma'
import { User } from '@prisma/client'
import { DEFAULT_POSITION, POSITION_GAP } from '../../shared/constants'

/**
 * Determines if a butler rule should execute based on the 'by' option
 * @param by - The trigger condition (ME, ANYONE, ANYONE_EXCEPT_ME)
 * @param currentUserId - The ID of the user who performed the action (e.g., created a card)
 * @param ruleCreatorId - The ID of the user who created the butler rule
 * @returns true if the rule should execute, false otherwise
 *
 * Examples:
 * - by: ME → Execute only if currentUserId === ruleCreatorId (rule creator performed the action)
 * - by: ANYONE → Always execute
 * - by: ANYONE_EXCEPT_ME → Execute only if currentUserId !== ruleCreatorId (someone else performed the action)
 */
export const shouldExecuteButler = (by: ByOption, currentUserId: string, ruleCreatorId: string): boolean => {
  switch (by) {
    case ByOption.ME:
      return currentUserId === ruleCreatorId
    case ByOption.ANYONE:
      return true
    case ByOption.ANYONE_EXCEPT_ME:
      return currentUserId !== ruleCreatorId
  }
}

export const calculateCardPosition = async (listId: string, position: PositionOption): Promise<number> => {
  if (position === PositionOption.BOTTOM) {
    const maxPos = await prisma.card.aggregate({
      where: { listId },
      _max: { position: true }
    })

    if (maxPos._max.position === null) {
      return DEFAULT_POSITION
    } else {
      return maxPos._max.position + POSITION_GAP
    }
  } else if (position === PositionOption.TOP) {
    const minPos = await prisma.card.aggregate({
      where: { listId },
      _min: { position: true }
    })

    if (minPos._min.position === null) {
      return DEFAULT_POSITION
    } else {
      return minPos._min.position - POSITION_GAP
    }
  }

  throw new Error('Invalid position target')
}

export const copyCardToList = async (
  cardId: string,
  targetListId: string,
  targetPosition: PositionOption
): Promise<{
  action: string
  status: string
  target?: string
  pos?: number
  copiedCardId?: string
  details?: string
}> => {
  const originalCard = await prisma.card.findUnique({
    where: { id: cardId },
    select: {
      slug: true,
      title: true,
      description: true,
      imageUrl: true,
      startDate: true,
      endDate: true,
      reminderType: true,
      isCompleted: true,
      creatorId: true
    }
  })

  if (!originalCard) {
    return { action: 'copy', status: 'skipped', details: 'Original card not found.' }
  }

  const newPosition = await calculateCardPosition(targetListId, targetPosition)

  const timestamp = Date.now()
  const copiedCard = await prisma.card.create({
    data: {
      title: `${originalCard.title} (copied)`,
      slug: `${originalCard.slug}-copied-${timestamp}`,
      description: originalCard.description,
      position: newPosition,
      imageUrl: originalCard.imageUrl,
      startDate: originalCard.startDate,
      endDate: originalCard.endDate,
      reminderType: originalCard.reminderType,
      isCompleted: originalCard.isCompleted,
      listId: targetListId,
      creatorId: originalCard.creatorId
    }
  })

  await Promise.allSettled([
    prisma.subtask
      .findMany({
        where: { cardId, isDeleted: false },
        select: { title: true, isDone: true }
      })
      .then((subtasks) =>
        prisma.subtask.createMany({
          data: subtasks.map((s) => ({
            cardId: copiedCard.id,
            title: s.title,
            isDone: s.isDone,
            isDeleted: false
          }))
        })
      ),

    prisma.cardAssignee
      .findMany({
        where: { cardId },
        select: { userId: true }
      })
      .then((assignees) =>
        prisma.cardAssignee.createMany({
          data: assignees.map((a) => ({
            cardId: copiedCard.id,
            userId: a.userId
          }))
        })
      ),

    prisma.attachment
      .findMany({
        where: { cardId, isDeleted: false },
        select: { url: true, fileName: true, fileType: true }
      })
      .then((attachments) =>
        prisma.attachment.createMany({
          data: attachments.map((a) => ({
            cardId: copiedCard.id,
            url: a.url,
            fileName: a.fileName,
            fileType: a.fileType,
            isDeleted: false
          }))
        })
      ),

    prisma.cardLabel
      .findMany({
        where: { cardId },
        select: { labelId: true }
      })
      .then((labels) =>
        prisma.cardLabel.createMany({
          data: labels.map((l) => ({
            cardId: copiedCard.id,
            labelId: l.labelId
          }))
        })
      )
  ])

  return {
    action: 'copy',
    status: 'success',
    target: targetListId,
    pos: newPosition,
    copiedCardId: copiedCard.id
  }
}

export const moveCardToList = async (
  cardId: string,
  targetListId: string,
  targetPosition: PositionOption
): Promise<{ action: string; status: string; target?: string; pos?: number; details?: string }> => {
  const newPosition = await calculateCardPosition(targetListId, targetPosition)

  await prisma.card.update({
    where: { id: cardId },
    data: {
      listId: targetListId,
      position: newPosition
    }
  })

  return { action: 'move', status: 'success', target: targetListId, pos: newPosition }
}

export const moveCardWithinBoard = async (
  cardId: string,
  moveOption: MoveCardActionOption,
  currentListId: string,
  currentListPosition: number,
  boardId: string
): Promise<{ action: string; status: string; target?: string; pos?: number; details?: string }> => {
  let newPosition: number
  let newListId = currentListId

  if (moveOption === MoveCardActionOption.TOP_CURRENT) {
    const minPos = await prisma.card.aggregate({
      where: { listId: currentListId },
      _min: { position: true }
    })

    newPosition = minPos._min.position === null ? DEFAULT_POSITION : minPos._min.position - POSITION_GAP
  } else if (moveOption === MoveCardActionOption.BOTTOM_CURRENT) {
    const maxPos = await prisma.card.aggregate({
      where: { listId: currentListId },
      _max: { position: true }
    })

    newPosition = (maxPos._max.position ?? 0) + POSITION_GAP
  } else if (moveOption === MoveCardActionOption.NEXT) {
    const nextList = await prisma.list.findFirst({
      where: {
        boardId: boardId,
        position: { gt: currentListPosition }
      },
      orderBy: { position: 'asc' }
    })

    if (!nextList) {
      return { action: 'move', status: 'skipped', details: 'No next list found.' }
    }

    const minPos = await prisma.card.aggregate({
      where: { listId: nextList.id },
      _min: { position: true }
    })

    newPosition = minPos._min.position === null ? DEFAULT_POSITION : minPos._min.position - POSITION_GAP
    newListId = nextList.id
  } else if (moveOption === MoveCardActionOption.PREVIOUS) {
    const prevList = await prisma.list.findFirst({
      where: {
        boardId: boardId,
        position: { lt: currentListPosition }
      },
      orderBy: { position: 'desc' }
    })

    if (!prevList) {
      return { action: 'move', status: 'skipped', details: 'No previous list found.' }
    }

    const maxPos = await prisma.card.aggregate({
      where: { listId: prevList.id },
      _min: { position: true }
    })

    newPosition = maxPos._min.position === null ? DEFAULT_POSITION : maxPos._min.position - POSITION_GAP
    newListId = prevList.id
  } else {
    return { action: 'move', status: 'skipped', details: 'Invalid action type.' }
  }

  await prisma.card.update({
    where: { id: cardId },
    data: {
      listId: newListId,
      position: newPosition
    }
  })

  return { action: 'move', status: 'success', target: newListId, pos: newPosition }
}

export const updateCardStatus = async (
  cardId: string,
  targetStatus: StatusOption,
  cardTitle: string
): Promise<{ action: string; status: string; target: string; value: StatusOption }> => {
  await prisma.card.update({
    where: { id: cardId },
    data: { isCompleted: targetStatus === StatusOption.COMPLETE }
  })

  return { action: 'mark-card-status', status: 'success', target: cardTitle, value: targetStatus }
}

export const assignMemberToCard = async (
  cardId: string,
  assignment: MemberAssignmentOption,
  boardId: string,
  cardTitle: string
): Promise<{ action: string; status: string; target?: string; value?: string; details?: string }> => {
  return await prisma.$transaction(async (tx) => {
    let user: User

    if (assignment === MemberAssignmentOption.RANDOM) {
      const members = await tx.user.findMany({
        where: {
          boardMemberships: {
            some: {
              boardId: boardId
            }
          }
        }
      })

      if (members.length === 0) {
        return { action: 'add-member', status: 'skipped', details: 'No members found on this board.' }
      }

      user = members[Math.floor(Math.random() * members.length)]

      const isAlreadyAssigned = await tx.cardAssignee.findFirst({
        where: {
          cardId: cardId,
          userId: user.id
        }
      })

      if (!isAlreadyAssigned) {
        await tx.cardAssignee.create({
          data: {
            cardId: cardId,
            userId: user.id
          }
        })

        await tx.boardMember.update({
          where: {
            boardId_userId: {
              boardId: boardId,
              userId: user.id
            }
          },
          data: { lastAssignedAt: new Date() }
        })
      }
    } else if (assignment === MemberAssignmentOption.TURN) {
      // Find the least recently used member
      const lruMember = await tx.boardMember.findFirst({
        where: {
          boardId: boardId
        },
        orderBy: {
          lastAssignedAt: 'asc'
        },
        select: {
          userId: true,
          boardId: true,
          user: true
        }
      })

      if (!lruMember) {
        return { action: 'add-member', status: 'skipped', details: 'No least recently used member found.' }
      }

      const isAlreadyAssigned = await tx.cardAssignee.findFirst({
        where: {
          cardId: cardId,
          userId: lruMember.userId
        }
      })

      if (!isAlreadyAssigned) {
        await tx.cardAssignee.create({
          data: {
            cardId: cardId,
            userId: lruMember.userId
          }
        })

        await tx.boardMember.update({
          where: {
            boardId_userId: {
              boardId: lruMember.boardId,
              userId: lruMember.userId
            }
          },
          data: { lastAssignedAt: new Date() }
        })
      }

      user = lruMember.user
    } else {
      return { action: 'add-member', status: 'skipped', details: 'Invalid assignment type.' }
    }

    return { action: 'add-member', status: 'success', target: cardTitle, value: user.fullName ?? user.email }
  })
}

/**
 * Execute actions for card-based rule triggers (WHEN_CARD_CREATED, WHEN_CARD_ADDED_TO_LIST)
 */
export const executeCardAction = async ({
  cardId,
  listId,
  listPosition,
  cardTitle,
  boardId,
  action,
  stepId,
  step
}: {
  cardId: string
  listId: string
  listPosition: number
  cardTitle: string
  boardId: string
  action: ActionSchema
  stepId: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  step: any
}) => {
  return await step.run(stepId, async () => {
    switch (action.handlerKey) {
      case 'MOVE_COPY_CARD_TO_LIST': {
        const { action: actionType, listId: targetListId, position: targetPosition } = action

        if (actionType === 'copy') {
          return await copyCardToList(cardId, targetListId, targetPosition)
        }

        if (actionType === 'move') {
          return await moveCardToList(cardId, targetListId, targetPosition)
        }

        return { action: 'move-copy', status: 'skipped', details: 'Invalid action type.' }
      }
      case 'MOVE_CARD': {
        const { action: actionType } = action
        return await moveCardWithinBoard(cardId, actionType, listId, listPosition, boardId)
      }
      case 'MARK_CARD_STATUS': {
        const { status: targetStatus } = action
        return await updateCardStatus(cardId, targetStatus, cardTitle)
      }
      case 'ADD_MEMBER': {
        const { assignment } = action
        return await assignMemberToCard(cardId, assignment, boardId, cardTitle)
      }
      case 'MOVE_LIST':
        return { action: 'move-list', status: 'skipped', details: 'MOVE_LIST action is not implemented yet.' }
      default:
        return { action: 'unknown', status: 'skipped', details: `Unknown handler key ${action.handlerKey}` }
    }
  })
}

/**
 * Execute actions for card status triggers (WHEN_CARD_MARKED_COMPLETE)
 */
export const executeCardStatusAction = async (
  cardId: string,
  action: ActionSchema,
  stepId: string,
  card: {
    id: string
    isCompleted: boolean
    title: string
    creatorId: string
    list: { id: string; position: number; boardId: string; board: { slug: string } }
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  step: any
) => {
  return await step.run(stepId, async () => {
    switch (action.handlerKey) {
      case 'MOVE_COPY_CARD_TO_LIST': {
        const { action: actionType, listId: targetListId, position: targetPosition } = action

        if (actionType === 'copy') {
          return await copyCardToList(cardId, targetListId, targetPosition)
        }

        if (actionType === 'move') {
          return await moveCardToList(cardId, targetListId, targetPosition)
        }

        return { action: 'move-copy', status: 'skipped', details: 'Invalid action type.' }
      }
      case 'MOVE_CARD': {
        const { action: actionType } = action
        return await moveCardWithinBoard(cardId, actionType, card.list.id, card.list.position, card.list.boardId)
      }
      case 'MARK_CARD_STATUS': {
        const { status: targetStatus } = action
        return await updateCardStatus(cardId, targetStatus, card.title)
      }
      case 'ADD_MEMBER': {
        const { assignment } = action
        return await assignMemberToCard(cardId, assignment, card.list.boardId, card.title)
      }
      case 'MOVE_LIST':
        return { action: 'move-list', status: 'skipped', details: 'MOVE_LIST action is not valid for card triggers.' }
      default:
        return { action: 'unknown', status: 'skipped', details: `Unknown handler key ${action.handlerKey}` }
    }
  })
}

/**
 * Execute actions for scheduled triggers (WHEN_SCHEDULED_DAILY, WHEN_SCHEDULED_WEEKLY, etc.)
 */
export const executeScheduledAction = async (
  action: ActionSchema,
  stepId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  step: any
) => {
  return await step.run(stepId, async () => {
    switch (action.handlerKey) {
      case 'CREATE_CARD': {
        const { type, title, listId } = action

        // Check if unique card type - prevent duplicates
        if (type === 'unique') {
          const existingCard = await prisma.card.findFirst({
            where: {
              title,
              listId,
              isDeleted: false
            }
          })

          if (existingCard) {
            return { action: 'create-card', status: 'skipped', details: 'Card with this title already exists.' }
          }
        }

        // Get the list and board owner to determine position and creator
        const list = await prisma.list.findUnique({
          where: { id: listId },
          select: { id: true, boardId: true, board: { select: { ownerId: true } } }
        })

        if (!list) {
          return { action: 'create-card', status: 'failed', details: 'List not found.' }
        }

        // Create the card at the top of the list
        const minPosCard = await prisma.card.aggregate({
          where: { listId, isDeleted: false },
          _min: { position: true }
        })

        const newPosition =
          minPosCard._min.position === null ? DEFAULT_POSITION : minPosCard._min.position - POSITION_GAP

        const slugify = (text: string): string => {
          return text
            .trim()
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
        }

        const card = await prisma.card.create({
          data: {
            title,
            slug: `${slugify(title)}-${Date.now()}`,
            listId,
            position: newPosition,
            creatorId: list.board.ownerId
          }
        })

        return { action: 'create-card', status: 'success', cardId: card.id, title: card.title }
      }
      case 'MOVE_COPY_ALL_CARDS': {
        const { action: actionType, fromListId, toListId } = action

        const cards = await prisma.card.findMany({
          where: { listId: fromListId, isDeleted: false },
          orderBy: { position: 'asc' },
          select: { id: true }
        })

        if (cards.length === 0) {
          return { action: 'move-copy-all', status: 'skipped', details: 'No cards to move/copy.' }
        }

        // For MOVE - use bulk update (much faster)
        if (actionType === 'move') {
          // Get target position
          const newPosition = await calculateCardPosition(toListId, PositionOption.TOP)

          // Bulk update all cards - single query
          await prisma.card.updateMany({
            where: {
              id: { in: cards.map((c) => c.id) }
            },
            data: {
              listId: toListId,
              position: newPosition
            }
          })

          return { action: 'move-copy-all', status: 'success', count: cards.length, moved: cards.length }
        }

        // For COPY - process in batches to avoid timeout
        if (actionType === 'copy') {
          const BATCH_SIZE = 10
          let totalCopied = 0

          for (let i = 0; i < cards.length; i += BATCH_SIZE) {
            const batch = cards.slice(i, i + BATCH_SIZE)

            // Process batch in parallel
            await Promise.allSettled(batch.map((card) => copyCardToList(card.id, toListId, PositionOption.TOP)))

            totalCopied += batch.length
          }

          return { action: 'move-copy-all', status: 'success', count: cards.length, copied: totalCopied }
        }

        return { action: 'move-copy-all', status: 'skipped', details: 'Invalid action type.' }
      }
      case 'MOVE_COPY_CARD_TO_LIST':
      case 'MOVE_CARD':
      case 'MARK_CARD_STATUS':
      case 'ADD_MEMBER':
      case 'MOVE_LIST':
        return {
          action: action.handlerKey.toLowerCase(),
          status: 'skipped',
          details: `${action.handlerKey} action is not valid for scheduled triggers.`
        }
      default: {
        return { action: 'unknown', status: 'skipped', details: `Unknown handler key` }
      }
    }
  })
}
