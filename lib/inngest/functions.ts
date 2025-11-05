import 'server-only'

import CardReminderMail from '@/components/mail-templates/card-reminder-mail'
import { ButlerData, ListPositionOption, StatusOption } from '@/features/butlers/types'
import prisma from '@/prisma/prisma'
import ablyService from '@/services/ably.service'
import mailService from '@/services/mail.service'
import { getReminderDate } from '@/shared/utils'
import { ButlerCategory, HandlerKey } from '@prisma/client'
import { render } from '@react-email/render'
import { format } from 'date-fns'
import { ABLY_CHANNELS, ABLY_EVENTS, DEFAULT_POSITION, POSITION_GAP } from '../../shared/constants'
import { inngest } from './client'
import { masterCronScheduler } from './cron'
import { executeCardAction, executeCardStatusAction, executeScheduledAction, shouldExecuteButler } from './utils'

// Rule Functions
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
      return {
        success: false,
        message: 'Original list not found.',
        listId: originalListId
      }
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
      return {
        success: false,
        message: 'Card not found.',
        cardId
      }
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
      return {
        success: true,
        message: 'No rules found for this event.',
        boardSlug,
        processedButlers: 0
      }
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
      success: true,
      message: 'All butler rules processed successfully.',
      boardSlug,
      cardId,
      processedButlers: allButlers.length,
      totalActions: executedActionSummaries.length,
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
      return {
        success: false,
        message: 'List not found.',
        listId
      }
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
      return {
        success: true,
        message: 'No rules found for this event.',
        boardId: list.board.id,
        processedButlers: 0
      }
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

                newPosition = maxPos._max.position === null ? DEFAULT_POSITION : maxPos._max.position + POSITION_GAP
              } else if (position === ListPositionOption.FIRST) {
                const minPos = await prisma.list.aggregate({
                  where: { boardId: list.board.id },
                  _min: { position: true }
                })

                newPosition = minPos._min.position === null ? DEFAULT_POSITION : minPos._min.position - POSITION_GAP
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
      success: true,
      message: 'All butler rules processed successfully.',
      boardId: list.board.id,
      boardSlug: list.board.slug,
      processedButlers: allButlers.length,
      totalActions: executedActionSummaries.length,
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
      return {
        success: false,
        message: 'Card not found.',
        cardId
      }
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
      return {
        success: true,
        message: 'No rules found for this event.',
        boardId: card.list.boardId,
        processedButlers: 0
      }
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
      success: true,
      message: 'All butler rules processed successfully.',
      boardId: card.list.boardId,
      boardSlug: card.list.board.slug,
      processedButlers: allButlers.length,
      totalActions: executedActionSummaries.length,
      summary: executedActionSummaries
    }
  }
)

// Scheduled Functions
export const handleScheduledDaily = inngest.createFunction(
  {
    id: 'handle-scheduled-daily'
  },
  {
    event: 'app/scheduled.daily'
  },
  async ({ event, step }) => {
    const { boardId, interval } = event.data

    const board = await step.run('get-board', async () => {
      return await prisma.board.findUnique({
        where: { id: boardId },
        select: { id: true, slug: true }
      })
    })

    if (!board) {
      return { message: 'Board not found.' }
    }

    const allButlers = await step.run('get-all-butlers', async () => {
      return await prisma.butler.findMany({
        where: {
          boardId: board.id,
          category: ButlerCategory.SCHEDULED,
          handlerKey: HandlerKey.WHEN_SCHEDULED_DAILY,
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
      return {
        success: true,
        message: 'No scheduled rules found for this board.',
        boardId: board.id,
        boardSlug: board.slug,
        interval,
        processedButlers: 0
      }
    }

    const executedActionSummaries = []

    for (const [butlerIndex, butler] of allButlers.entries()) {
      const parsedDetails = butler.details as ButlerData
      const { trigger, actions } = parsedDetails

      // Check if interval matches (day vs weekday)
      if (trigger.handlerKey === HandlerKey.WHEN_SCHEDULED_DAILY && trigger.interval !== interval) {
        continue
      }

      let allActionsSucceeded = true

      for (const [actionIndex, action] of actions.entries()) {
        const stepId = `butler-${butlerIndex}-action-${actionIndex}-key-${action.handlerKey}`
        const actionResult = await executeScheduledAction(action, stepId, step)
        executedActionSummaries.push(actionResult)

        if (actionResult.status !== 'success') {
          allActionsSucceeded = false
        }
      }

      if (allActionsSucceeded) {
        await step.run(`ably-publish-${butlerIndex}`, async () => {
          await ablyService.publish(ABLY_CHANNELS.BOARD(board.slug), ABLY_EVENTS.SCHEDULED_ACTION, {
            boardSlug: board.slug
          })

          return { action: 'ably-publish', status: 'success', target: board.slug }
        })
      }
    }

    return {
      success: true,
      message: 'All scheduled daily butlers processed successfully.',
      boardId: board.id,
      boardSlug: board.slug,
      interval,
      processedButlers: allButlers.length,
      executedButlers: executedActionSummaries.length > 0 ? executedActionSummaries.length : 0,
      totalActions: executedActionSummaries.length,
      summary: executedActionSummaries
    }
  }
)

export const handleScheduledWeekly = inngest.createFunction(
  {
    id: 'handle-scheduled-weekly'
  },
  {
    event: 'app/scheduled.weekly'
  },
  async ({ event, step }) => {
    const { boardId, day } = event.data

    const board = await step.run('get-board', async () => {
      return await prisma.board.findUnique({
        where: { id: boardId },
        select: { id: true, slug: true }
      })
    })

    if (!board) {
      return {
        success: false,
        message: 'Board not found.',
        boardId
      }
    }

    const allButlers = await step.run('get-all-butlers', async () => {
      return await prisma.butler.findMany({
        where: {
          boardId: board.id,
          category: ButlerCategory.SCHEDULED,
          handlerKey: HandlerKey.WHEN_SCHEDULED_WEEKLY,
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
      return {
        success: true,
        message: 'No scheduled weekly rules found for this board.',
        boardId: board.id,
        boardSlug: board.slug,
        day,
        processedButlers: 0
      }
    }

    const executedActionSummaries = []

    for (const [butlerIndex, butler] of allButlers.entries()) {
      const parsedDetails = butler.details as ButlerData
      const { trigger, actions } = parsedDetails

      // Check if day matches
      if (trigger.handlerKey === HandlerKey.WHEN_SCHEDULED_WEEKLY && trigger.day !== day) {
        continue
      }

      let allActionsSucceeded = true

      for (const [actionIndex, action] of actions.entries()) {
        const stepId = `butler-${butlerIndex}-action-${actionIndex}-key-${action.handlerKey}`
        const actionResult = await executeScheduledAction(action, stepId, step)
        executedActionSummaries.push(actionResult)

        if (actionResult.status !== 'success') {
          allActionsSucceeded = false
        }
      }

      if (allActionsSucceeded) {
        await step.run(`ably-publish-${butlerIndex}`, async () => {
          await ablyService.publish(ABLY_CHANNELS.BOARD(board.slug), ABLY_EVENTS.SCHEDULED_ACTION, {
            boardSlug: board.slug
          })

          return { action: 'ably-publish', status: 'success', target: board.slug }
        })
      }
    }

    return {
      success: true,
      message: 'All scheduled weekly butlers processed successfully.',
      boardId: board.id,
      boardSlug: board.slug,
      day,
      processedButlers: allButlers.length,
      executedButlers: executedActionSummaries.length > 0 ? executedActionSummaries.length : 0,
      totalActions: executedActionSummaries.length,
      summary: executedActionSummaries
    }
  }
)

export const handleScheduledXWeeks = inngest.createFunction(
  {
    id: 'handle-scheduled-x-weeks'
  },
  {
    event: 'app/scheduled.x-weeks'
  },
  async ({ event, step }) => {
    const { boardId, day, weekNumber } = event.data

    const board = await step.run('get-board', async () => {
      return await prisma.board.findUnique({
        where: { id: boardId },
        select: { id: true, slug: true }
      })
    })

    if (!board) {
      return {
        success: false,
        message: 'Board not found.',
        boardId
      }
    }

    const allButlers = await step.run('get-all-butlers', async () => {
      return await prisma.butler.findMany({
        where: {
          boardId: board.id,
          category: ButlerCategory.SCHEDULED,
          handlerKey: HandlerKey.WHEN_SCHEDULED_X_WEEKS,
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
      return {
        success: true,
        message: 'No scheduled x-weeks rules found for this board.',
        boardId: board.id,
        boardSlug: board.slug,
        day,
        weekNumber,
        processedButlers: 0
      }
    }

    const executedActionSummaries = []

    for (const [butlerIndex, butler] of allButlers.entries()) {
      const parsedDetails = butler.details as ButlerData
      const { trigger, actions } = parsedDetails

      // Check if day matches and week number aligns with interval
      if (trigger.handlerKey === HandlerKey.WHEN_SCHEDULED_X_WEEKS) {
        if (trigger.day !== day || weekNumber % trigger.interval !== 0) {
          continue
        }
      }

      let allActionsSucceeded = true

      for (const [actionIndex, action] of actions.entries()) {
        const stepId = `butler-${butlerIndex}-action-${actionIndex}-key-${action.handlerKey}`
        const actionResult = await executeScheduledAction(action, stepId, step)
        executedActionSummaries.push(actionResult)

        if (actionResult.status !== 'success') {
          allActionsSucceeded = false
        }
      }

      if (allActionsSucceeded) {
        await step.run(`ably-publish-${butlerIndex}`, async () => {
          await ablyService.publish(ABLY_CHANNELS.BOARD(board.slug), ABLY_EVENTS.SCHEDULED_ACTION, {
            boardSlug: board.slug
          })

          return { action: 'ably-publish', status: 'success', target: board.slug }
        })
      }
    }

    return {
      success: true,
      message: 'All scheduled x-weeks butlers processed successfully.',
      boardId: board.id,
      boardSlug: board.slug,
      day,
      weekNumber,
      processedButlers: allButlers.length,
      executedButlers: executedActionSummaries.length > 0 ? executedActionSummaries.length : 0,
      totalActions: executedActionSummaries.length,
      summary: executedActionSummaries
    }
  }
)

// Email Functions
export const handleCardReminder = inngest.createFunction(
  {
    id: 'handle-card-reminder',
    cancelOn: [
      {
        event: 'card/reminder.cancelled',
        if: 'async.data.cardId == event.data.cardId'
      }
    ]
  },
  {
    event: 'card/reminder.scheduled'
  },
  async ({ event, step }) => {
    const { cardId } = event.data

    const card = await step.run('fetch-card-data', async () => {
      return await prisma.card.findUnique({
        where: { id: cardId },
        include: {
          list: {
            include: {
              board: { select: { id: true, name: true, slug: true } }
            }
          },
          assignees: { select: { user: { select: { id: true, email: true } } } },
          watchers: { select: { user: { select: { id: true, email: true } } } }
        }
      })
    })

    if (!card) {
      return { message: 'Card not found' }
    }

    if (!card.endDate || card.reminderType === 'NONE') {
      return { message: 'No reminder set for card' }
    }

    const reminderDate = await step.run('calculate-reminder-date', () => {
      const endDate = new Date(card.endDate!)
      return getReminderDate(endDate, card.reminderType)
    })

    // Sleep until reminder date
    await step.sleepUntil('wait-for-reminder-date', reminderDate)

    // Re-fetch card data to get latest state before sending
    await step.run('send-reminder-email', async () => {
      const latestCard = await prisma.card.findUnique({
        where: { id: cardId },
        include: {
          list: {
            include: {
              board: { select: { id: true, name: true, slug: true } }
            }
          },
          assignees: { select: { user: { select: { email: true } } } },
          watchers: { select: { user: { select: { email: true } } } }
        }
      })

      if (!latestCard || !latestCard.endDate) {
        return { message: 'Card no longer has reminder' }
      }

      const board = latestCard.list.board

      const emails = [
        ...latestCard.assignees.map((a) => a.user.email),
        ...latestCard.watchers.map((w) => w.user.email)
      ].filter((email, index, self) => email && self.indexOf(email) === index)

      if (emails.length === 0) {
        return { message: 'No recipients for card' }
      }

      const html = await render(
        CardReminderMail({
          boardName: board.name,
          cardTitle: latestCard.title,
          endDate: format(latestCard.endDate, "d 'tháng' M, 'năm' yyyy 'lúc' HH:mm"),
          // TODO: replace with production URL
          cardUrl: `http://localhost:3000/b/${board.slug}/c/${latestCard.slug}`
        })
      )

      await mailService.sendEmails({
        payload: {
          from: 'Trello Clone <system@mail.dahn.work>',
          to: emails,
          subject: `Thẻ ${latestCard.title} trong bảng ${board.name} sắp hết hạn`,
          html
        }
      })
    })

    return { message: 'Reminder successfully sent.' }
  }
)

export const functions = [
  handleCardCreated,
  handleListCreated,
  handleCardStatus,
  handleScheduledDaily,
  handleScheduledWeekly,
  handleScheduledXWeeks,
  masterCronScheduler,
  handleCardReminder
]
