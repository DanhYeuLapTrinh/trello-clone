import 'server-only'

import { ButlerData, ListPositionOption, MoveCopyOption, StatusOption } from '@/features/butlers/types'
import { ActionSchema } from '@/features/butlers/validations/server'
import prisma from '@/prisma/prisma'
import ablyService from '@/services/ably.service'
import { ButlerCategory, HandlerKey } from '@prisma/client'
import { ABLY_CHANNELS, ABLY_EVENTS, POSITION_GAP } from '../constants'
import { inngest } from './client'
import {
  assignMemberToCard,
  copyCardToList,
  moveCardToList,
  moveCardWithinBoard,
  shouldExecuteButler,
  updateCardStatus
} from './utils'

// Actions
/**
 * Execute card-related actions for card triggers (WHEN_CARD_CREATED, WHEN_CARD_ADDED_TO_LIST)
 * Only handles actions that operate on cards, not lists
 */
const executeCardAction = async ({
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
      case HandlerKey.MOVE_COPY_CARD_TO_LIST: {
        const { action: actionType, listId: targetListId, position: targetPosition } = action

        if (actionType === MoveCopyOption.COPY) {
          return await copyCardToList(cardId, targetListId, targetPosition)
        }

        if (actionType === MoveCopyOption.MOVE) {
          return await moveCardToList(cardId, targetListId, targetPosition)
        }

        return { action: 'move-copy', status: 'skipped', details: 'Invalid action type.' }
      }
      case HandlerKey.MOVE_CARD: {
        const { action: actionType } = action
        return await moveCardWithinBoard(cardId, actionType, listId, listPosition, boardId)
      }
      case HandlerKey.MARK_CARD_STATUS: {
        const { status: targetStatus } = action
        return await updateCardStatus(cardId, targetStatus, cardTitle)
      }
      case HandlerKey.ADD_MEMBER: {
        const { assignment } = action
        return await assignMemberToCard(cardId, assignment, boardId, cardTitle)
      }
      case HandlerKey.MOVE_LIST:
        // TODO: Implement this in the future
        return { action: 'move-list', status: 'skipped', details: 'MOVE_LIST action is not implemented yet.' }
      default:
        return { action: 'unknown', status: 'skipped', details: `Unknown handler key ${action.handlerKey}` }
    }
  })
}

/**
 * Execute card-related actions for card status trigger (WHEN_CARD_MARKED_COMPLETE)
 * Only handles actions that operate on cards, not lists
 */
const executeCardStatusAction = async (
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
      case HandlerKey.MOVE_COPY_CARD_TO_LIST: {
        const { action: actionType, listId: targetListId, position: targetPosition } = action

        if (actionType === MoveCopyOption.COPY) {
          return await copyCardToList(cardId, targetListId, targetPosition)
        }

        if (actionType === MoveCopyOption.MOVE) {
          return await moveCardToList(cardId, targetListId, targetPosition)
        }

        return { action: 'move-copy', status: 'skipped', details: 'Invalid action type.' }
      }
      case HandlerKey.MOVE_CARD: {
        const { action: actionType } = action
        return await moveCardWithinBoard(cardId, actionType, card.list.id, card.list.position, card.list.boardId)
      }
      case HandlerKey.MARK_CARD_STATUS: {
        const { status: targetStatus } = action
        return await updateCardStatus(cardId, targetStatus, card.title)
      }
      case HandlerKey.ADD_MEMBER: {
        const { assignment } = action
        return await assignMemberToCard(cardId, assignment, card.list.boardId, card.title)
      }
      case HandlerKey.MOVE_LIST:
        // This action is not valid for card triggers
        return { action: 'move-list', status: 'skipped', details: 'MOVE_LIST action is not valid for card triggers.' }
      default:
        return { action: 'unknown', status: 'skipped', details: `Unknown handler key ${action.handlerKey}` }
    }
  })
}

// Functions
export const handleCardCreated = inngest.createFunction(
  {
    id: 'handle-card-created'
  },
  {
    event: 'app/card.created'
  },
  async ({ event, step }) => {
    const { cardId, boardSlug, userId, listId: originalListId } = event.data

    const originalList = await step.run('get-original-list', async () => {
      return await prisma.list.findUnique({
        where: { id: originalListId },
        select: { id: true, position: true, boardId: true, board: { select: { slug: true } } }
      })
    })

    if (!originalList) {
      return { message: 'Original list not found.' }
    }

    const card = await step.run('get-card', async () => {
      return await prisma.card.findUnique({
        where: { id: cardId, list: { board: { slug: boardSlug } } },
        select: {
          id: true,
          slug: true,
          listId: true,
          position: true,
          creatorId: true,
          title: true,
          list: { select: { boardId: true } }
        }
      })
    })

    if (!card) {
      return { message: 'Card not found.' }
    }

    // Fetch ALL relevant butler rules (both WHEN_CARD_CREATED and WHEN_CARD_ADDED_TO_LIST)
    // and sort them by creation time to respect user's intended automation order
    const allButlers = await step.run('get-all-butlers', async () => {
      return await prisma.butler.findMany({
        where: {
          board: { slug: boardSlug },
          category: ButlerCategory.RULE,
          handlerKey: {
            in: [HandlerKey.WHEN_CARD_CREATED, HandlerKey.WHEN_CARD_ADDED_TO_LIST]
          },
          isEnabled: true,
          isDeleted: false
        },
        select: {
          id: true,
          creatorId: true,
          category: true,
          handlerKey: true,
          details: true,
          createdAt: true
        },
        orderBy: { createdAt: 'asc' }
      })
    })

    if (allButlers.length === 0) {
      return { message: 'No rules found for this event.' }
    }

    const executedActionSummaries = []

    for (const [butlerIndex, butler] of allButlers.entries()) {
      const parsedDetails = butler.details as ButlerData
      const { trigger, actions } = parsedDetails

      // Check if this rule should execute based on trigger type
      // The 'by' option checks if the current user (userId) matches the rule creator (butler.creatorId)
      let shouldProcessThisButler = false

      if (trigger.handlerKey === HandlerKey.WHEN_CARD_CREATED) {
        shouldProcessThisButler = shouldExecuteButler(trigger.by, userId, butler.creatorId)
      } else if (trigger.handlerKey === HandlerKey.WHEN_CARD_ADDED_TO_LIST) {
        shouldProcessThisButler =
          trigger.listId === originalListId && shouldExecuteButler(trigger.by, userId, butler.creatorId)
      }

      if (!shouldProcessThisButler) {
        continue
      }

      let allActionsSucceeded = true

      // Execute all actions for this butler rule
      for (const [actionIndex, action] of actions.entries()) {
        const stepId = `butler-${butlerIndex}-action-${actionIndex}-key-${action.handlerKey}`
        const actionResult = await executeCardAction({
          cardId,
          listId: originalList.id,
          listPosition: originalList.position,
          cardTitle: card.title,
          boardId: card.list.boardId,
          action,
          stepId,
          step
        })
        executedActionSummaries.push(actionResult)

        if (actionResult.status !== 'success') {
          allActionsSucceeded = false
        }
      }

      if (allActionsSucceeded) {
        await step.run(`ably-publish-${butlerIndex}`, async () => {
          switch (trigger.handlerKey) {
            case HandlerKey.WHEN_CARD_CREATED:
              await ablyService.publish(ABLY_CHANNELS.BOARD(boardSlug), ABLY_EVENTS.CARD_CREATED, {
                boardSlug,
                cardSlug: card.slug
              })

              return { action: 'ably-publish', status: 'success', target: boardSlug }
            case HandlerKey.WHEN_CARD_ADDED_TO_LIST:
              await ablyService.publish(ABLY_CHANNELS.BOARD(boardSlug), ABLY_EVENTS.CARD_ADDED_TO_LIST, {
                boardSlug
              })

              return { action: 'ably-publish', status: 'success', target: boardSlug }
          }
        })
      }
    }

    return {
      message: 'All butler rules processed successfully.',
      summary: executedActionSummaries
    }
  }
)

export const handleListCreated = inngest.createFunction(
  {
    id: 'handle-list-created'
  },
  {
    event: 'app/list.created'
  },
  async ({ event, step }) => {
    const { listId, userId } = event.data

    const list = await step.run('get-list', async () => {
      return await prisma.list.findUnique({
        where: {
          id: listId
        },
        select: {
          id: true,
          creatorId: true,
          board: {
            select: {
              id: true,
              slug: true
            }
          }
        }
      })
    })

    if (!list) {
      return { message: 'List not found.' }
    }

    const allButlers = await step.run('get-all-butlers', async () => {
      return await prisma.butler.findMany({
        where: {
          board: {
            id: list.board.id
          },
          category: ButlerCategory.RULE,
          handlerKey: HandlerKey.WHEN_LIST_CREATED,
          isEnabled: true,
          isDeleted: false
        },
        select: {
          id: true,
          creatorId: true,
          category: true,
          handlerKey: true,
          details: true,
          createdAt: true
        },
        orderBy: { createdAt: 'asc' }
      })
    })

    if (allButlers.length === 0) {
      return { message: 'No rules found for this event.' }
    }

    const executedActionSummaries = []

    for (const [butlerIndex, butler] of allButlers.entries()) {
      const parsedDetails = butler.details as ButlerData
      const { trigger, actions } = parsedDetails

      let shouldProcessThisButler = false

      if (trigger.handlerKey === HandlerKey.WHEN_LIST_CREATED) {
        // The 'by' option checks if the current user (userId) matches the rule creator (butler.creatorId)
        shouldProcessThisButler = shouldExecuteButler(trigger.by, userId, butler.creatorId)
      }

      if (!shouldProcessThisButler) {
        continue
      }

      let allActionsSucceeded = true

      // Execute all actions for this butler rule
      for (const [actionIndex, action] of actions.entries()) {
        const stepId = `butler-${butlerIndex}-action-${actionIndex}-key-${action.handlerKey}`

        const actionResult = await step.run(stepId, async () => {
          switch (action.handlerKey) {
            case HandlerKey.MOVE_LIST: {
              const { position } = action

              let newPosition: number

              if (position === ListPositionOption.LAST) {
                const maxPos = await prisma.list.aggregate({
                  where: { boardId: list.board.id },
                  _max: { position: true }
                })

                newPosition = (maxPos._max.position ?? 0) + POSITION_GAP
              } else if (position === ListPositionOption.FIRST) {
                const minPos = await prisma.list.aggregate({
                  where: { boardId: list.board.id },
                  _min: { position: true }
                })

                newPosition = (minPos._min.position ?? 0) - POSITION_GAP
              } else {
                return { action: 'move', status: 'skipped', details: 'Invalid position target.' }
              }

              await prisma.list.update({
                where: { id: listId },
                data: {
                  position: newPosition
                }
              })

              return { action: 'move', status: 'success', target: listId, pos: newPosition }
            }
            case HandlerKey.MOVE_COPY_CARD_TO_LIST:
            case HandlerKey.MOVE_CARD:
            case HandlerKey.MARK_CARD_STATUS:
            case HandlerKey.ADD_MEMBER:
              // These actions are not valid for list triggers
              return {
                action: action.handlerKey.toLowerCase(),
                status: 'skipped',
                details: `${action.handlerKey} action is not valid for list triggers.`
              }
            default:
              return { action: 'unknown', status: 'skipped', details: `Unknown handler key ${action.handlerKey}` }
          }
        })

        executedActionSummaries.push(actionResult)

        if (actionResult.status !== 'success') {
          allActionsSucceeded = false
        }
      }

      if (allActionsSucceeded) {
        await step.run(`ably-publish-${butlerIndex}`, async () => {
          await ablyService.publish(ABLY_CHANNELS.BOARD(list.board.slug), ABLY_EVENTS.LIST_MOVED, {
            boardSlug: list.board.slug
          })

          return { action: 'ably-publish', status: 'success', target: list.board.slug }
        })
      }
    }

    return {
      message: 'All butler rules processed successfully.',
      summary: executedActionSummaries
    }
  }
)

export const handleCardStatus = inngest.createFunction(
  {
    id: 'handle-card-status'
  },
  {
    event: 'app/card.status'
  },
  async ({ event, step }) => {
    const { cardId, userId } = event.data

    const card = await step.run('get-card', async () => {
      return await prisma.card.findUnique({
        where: { id: cardId },
        select: {
          id: true,
          isCompleted: true,
          title: true,
          creatorId: true,
          list: { select: { id: true, position: true, boardId: true, board: { select: { slug: true } } } }
        }
      })
    })

    if (!card) {
      return { message: 'Card not found.' }
    }

    const allButlers = await step.run('get-all-butlers', async () => {
      return await prisma.butler.findMany({
        where: {
          board: {
            id: card.list.boardId
          },
          category: ButlerCategory.RULE,
          handlerKey: HandlerKey.WHEN_CARD_MARKED_COMPLETE,
          isEnabled: true,
          isDeleted: false
        },
        select: {
          id: true,
          creatorId: true,
          category: true,
          handlerKey: true,
          details: true,
          createdAt: true
        },
        orderBy: { createdAt: 'asc' }
      })
    })

    if (allButlers.length === 0) {
      return { message: 'No rules found for this event.' }
    }

    const executedActionSummaries = []

    for (const [butlerIndex, butler] of allButlers.entries()) {
      const parsedDetails = butler.details as ButlerData
      const { trigger, actions } = parsedDetails

      let shouldProcessThisButler = false

      if (trigger.handlerKey === HandlerKey.WHEN_CARD_MARKED_COMPLETE) {
        const status = trigger.status === StatusOption.COMPLETE ? true : false
        shouldProcessThisButler =
          card.isCompleted === status && shouldExecuteButler(trigger.by, userId, butler.creatorId)
      }

      if (!shouldProcessThisButler) {
        continue
      }

      let allActionsSucceeded = true

      // Execute all actions for this butler rule
      for (const [actionIndex, action] of actions.entries()) {
        const stepId = `butler-${butlerIndex}-action-${actionIndex}-key-${action.handlerKey}`
        const actionResult = await executeCardStatusAction(cardId, action, stepId, card, step)
        executedActionSummaries.push(actionResult)

        if (actionResult.status !== 'success') {
          allActionsSucceeded = false
        }
      }

      if (allActionsSucceeded) {
        await step.run(`ably-publish-${butlerIndex}`, async () => {
          await ablyService.publish(ABLY_CHANNELS.BOARD(card.list.board.slug), ABLY_EVENTS.CARD_STATUS, {
            boardSlug: card.list.board.slug
          })

          return { action: 'ably-publish', status: 'success', target: card.title }
        })
      }
    }

    return {
      message: 'All butler rules processed successfully.',
      summary: executedActionSummaries
    }
  }
)

export const functions = [handleCardCreated, handleListCreated, handleCardStatus]
