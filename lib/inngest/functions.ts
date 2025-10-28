import 'server-only'

import { ButlerData } from '@/features/butlers/types'
import prisma from '@/prisma/prisma'
import ablyService from '@/services/ably.service'
import { NotFoundError } from '@/types/error'
import { ButlerCategory, HandlerKey } from '@prisma/client'
import { ABLY_CHANNELS, ABLY_EVENTS } from '../constants'
import { inngest } from './client'
import { shouldExecuteButler } from './utils'

// WHEN_CARD_CREATED
export const handleCardCreated = inngest.createFunction(
  {
    id: 'handle-card-created'
  },
  {
    event: 'app/card.created'
  },
  async ({ event, step }) => {
    const { cardId, boardSlug, userId } = event.data

    const card = await step.run('get-card', async () => {
      return await prisma.card.findUnique({
        where: { id: cardId, list: { board: { slug: boardSlug } } },
        select: { id: true, listId: true, position: true, creatorId: true }
      })
    })

    if (!card) {
      throw new NotFoundError('Card')
    }

    const butlers = await step.run('get-butlers', async () => {
      return await prisma.butler.findMany({
        where: {
          board: { slug: boardSlug },
          category: ButlerCategory.RULE,
          handlerKey: HandlerKey.WHEN_CARD_CREATED,
          isEnabled: true
        },
        orderBy: { createdAt: 'asc' },
        omit: { isDeleted: true, createdAt: true, updatedAt: true }
      })
    })

    if (butlers.length === 0) {
      return { message: 'No rules found for this event.' }
    }

    const executedActionSummaries = []

    for (const [butlerIndex, butler] of butlers.entries()) {
      const parsedDetails = butler.details as ButlerData
      const { trigger, actions } = parsedDetails

      if (trigger.handlerKey !== HandlerKey.WHEN_CARD_CREATED) {
        continue
      }

      const shouldExecute = shouldExecuteButler(trigger.by, userId, card.creatorId)

      if (!shouldExecute) {
        continue
      }

      for (const [actionIndex, action] of actions.entries()) {
        const stepId = `butler-${butlerIndex}-action-${actionIndex}-key-${action.handlerKey}`

        const actionResult = await step.run(stepId, async () => {
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

                  newPosition = (minPos._min.position ?? 1024) - 1024
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
        executedActionSummaries.push(actionResult)
      }
    }

    await step.run('ably-publish', async () => {
      await ablyService.publish(ABLY_CHANNELS.BOARD(boardSlug), ABLY_EVENTS.CARD_CREATED, {
        boardSlug
      })

      return { message: 'Ably publish successful.' }
    })

    return {
      message: 'All butler rules processed successfully.',
      summary: executedActionSummaries
    }
  }
)

export const functions = [handleCardCreated]
