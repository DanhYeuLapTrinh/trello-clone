import 'server-only'

import { ButlerData } from '@/features/butlers/types'
import { ActionSchema } from '@/features/butlers/validations/server'
import prisma from '@/prisma/prisma'
import ablyService from '@/services/ably.service'
import { ButlerCategory, HandlerKey } from '@prisma/client'
import { ABLY_CHANNELS, ABLY_EVENTS } from '../constants'
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

        if (actionType === 'copy') {
          return { action: 'copy', status: 'skipped', details: 'Copy logic not yet implemented.' }
        }

        if (actionType === 'move') {
          let newPosition: number

          if (targetPosition === 'bottom') {
            const maxPos = await prisma.card.aggregate({
              where: { listId: targetListId },
              _max: { position: true }
            })

            newPosition = (maxPos._max.position ?? 0) + 1024
          } else if (targetPosition === 'top') {
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
              break
            case HandlerKey.WHEN_CARD_ADDED_TO_LIST:
              await ablyService.publish(ABLY_CHANNELS.BOARD(boardSlug), ABLY_EVENTS.CARD_ADDED_TO_LIST, {
                boardSlug
              })
              break
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

export const functions = [handleCardCreated]
