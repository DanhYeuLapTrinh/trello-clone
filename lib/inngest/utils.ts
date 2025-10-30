import 'server-only'

import {
  ByOption,
  MemberAssignmentOption,
  MoveCardActionOption,
  PositionOption,
  StatusOption
} from '@/features/butlers/types'
import prisma from '@/prisma/prisma'
import { User } from '@prisma/client'
import { DEFAULT_POSITION, POSITION_GAP } from '../constants'

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
  return await prisma.$transaction(async (tx) => {
    // Get the original card with all its relations
    const originalCard = await tx.card.findUnique({
      where: { id: cardId },
      include: {
        subtasks: {
          where: { isDeleted: false },
          orderBy: { createdAt: 'asc' }
        },
        assignees: true,
        attachments: {
          where: { isDeleted: false },
          orderBy: { createdAt: 'asc' }
        },
        cardLabels: true,
        watchers: true
      }
    })

    if (!originalCard) {
      return { action: 'copy', status: 'skipped', details: 'Original card not found.' }
    }

    // Calculate position for the copied card
    const newPosition = await calculateCardPosition(targetListId, targetPosition)

    // Generate a unique slug for the copied card
    const timestamp = Date.now()
    const newSlug = `${originalCard.slug}-copied-${timestamp}`

    // Create the copied card with all its relations
    const copiedCard = await tx.card.create({
      data: {
        title: `${originalCard.title} (copied)`,
        slug: newSlug,
        description: originalCard.description,
        position: newPosition,
        imageUrl: originalCard.imageUrl,
        startDate: originalCard.startDate,
        endDate: originalCard.endDate,
        reminderType: originalCard.reminderType,
        isCompleted: originalCard.isCompleted,
        listId: targetListId,
        creatorId: originalCard.creatorId,
        subtasks: {
          create: originalCard.subtasks.map((subtask) => ({
            title: subtask.title,
            isDone: subtask.isDone,
            isDeleted: false
          }))
        },
        assignees: {
          create: originalCard.assignees.map((assignee) => ({
            userId: assignee.userId
          }))
        },
        attachments: {
          create: originalCard.attachments.map((attachment) => ({
            url: attachment.url,
            fileName: attachment.fileName,
            fileType: attachment.fileType,
            isDeleted: false
          }))
        },
        cardLabels: {
          create: originalCard.cardLabels.map((cardLabel) => ({
            labelId: cardLabel.labelId
          }))
        },
        watchers: {
          create: originalCard.watchers.map((watcher) => ({
            userId: watcher.userId
          }))
        }
      }
    })

    return {
      action: 'copy',
      status: 'success',
      target: targetListId,
      pos: newPosition,
      copiedCardId: copiedCard.id
    }
  })
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
