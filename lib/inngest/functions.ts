import 'server-only'

import { ButlerData, ListPositionOption, MoveCopyOption, PositionOption } from '@/features/butlers/types'
import { ActionSchema } from '@/features/butlers/validations/server'
import prisma from '@/prisma/prisma'
import ablyService from '@/services/ably.service'
import { ButlerCategory, HandlerKey } from '@prisma/client'
import { ABLY_CHANNELS, ABLY_EVENTS, POSITION_GAP } from '../constants'
import { inngest } from './client'
import { shouldExecuteButler } from './utils'

const executeCardMoveAction = async (
  cardId: string,
  action: ActionSchema,
  stepId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  step: any
) => {
  return await step.run(stepId, async () => {
    switch (action.handlerKey) {
      case HandlerKey.MOVE_COPY_CARD_TO_LIST: {
        const { action: actionType, listId: targetListId, position: targetPosition } = action

        if (actionType === MoveCopyOption.COPY) {
          return { action: 'copy', status: 'skipped', details: 'Copy logic not yet implemented.' }
        }

        if (actionType === MoveCopyOption.MOVE) {
          let newPosition: number

          if (targetPosition === PositionOption.BOTTOM) {
            const maxPos = await prisma.card.aggregate({
              where: { listId: targetListId },
              _max: { position: true }
            })

            newPosition = (maxPos._max.position ?? 0) + 1024
          } else if (targetPosition === PositionOption.TOP) {
            const minPos = await prisma.card.aggregate({
              where: { listId: targetListId },
              _min: { position: true }
            })

            if (minPos._min.position === null) {
              // List is empty, set to default position
              newPosition = 1024
            } else {
              // List has items, go halfway to the top
              newPosition = minPos._min.position / 2
            }
          } else {
            return { action: 'move', status: 'skipped', details: 'Invalid position target.' }
          }

          await prisma.card.update({
            where: { id: cardId },
            data: {
              listId: targetListId,
              position: newPosition
            }
          })

          return { action: 'move', status: 'success', target: targetListId, pos: newPosition }
        }
      }
      default:
        return { action: 'unknown', status: 'skipped', details: `Unknown handler key ${action.handlerKey}` }
    }
  })
}

export const handleCardCreated = inngest.createFunction(
  {
    id: 'handle-card-created'
  },
  {
    event: 'app/card.created'
  },
  async ({ event, step }) => {
    const { cardId, boardSlug, userId, listId: originalListId } = event.data

    const card = await step.run('get-card', async () => {
      return await prisma.card.findUnique({
        where: { id: cardId, list: { board: { slug: boardSlug } } },
        select: { id: true, listId: true, position: true, creatorId: true }
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
      let shouldProcessThisButler = false

      if (trigger.handlerKey === HandlerKey.WHEN_CARD_CREATED) {
        shouldProcessThisButler = shouldExecuteButler(trigger.by, userId, card.creatorId)
      } else if (trigger.handlerKey === HandlerKey.WHEN_CARD_ADDED_TO_LIST) {
        shouldProcessThisButler =
          trigger.listId === originalListId && shouldExecuteButler(trigger.by, userId, card.creatorId)
      }

      if (!shouldProcessThisButler) {
        continue
      }

      let allActionsSucceeded = true

      // Execute all actions for this butler rule
      for (const [actionIndex, action] of actions.entries()) {
        const stepId = `butler-${butlerIndex}-action-${actionIndex}-key-${action.handlerKey}`
        const actionResult = await executeCardMoveAction(cardId, action, stepId, step)
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
                boardSlug
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
          handlerKey: HandlerKey.WHEN_LIST_CREATED
        }
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
        shouldProcessThisButler = shouldExecuteButler(trigger.by, userId, list.creatorId)
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

export const functions = [handleCardCreated, handleListCreated]
