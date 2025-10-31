import { IntervalOption } from '@/features/butlers/types'
import prisma from '@/prisma/prisma'
import { ButlerCategory } from '@prisma/client'
import { inngest } from './client'

const DAY_OF_WEEK_MAP = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

// Calculate the current date parts and "fan out" events to the actual handler functions for every board that has scheduled butlers.
export const masterCronScheduler = inngest.createFunction(
  {
    id: 'master-cron-scheduler-6am'
  },
  {
    // Run at 6:00 AM every day in Asia/Ho_Chi_Minh timezone
    cron: 'TZ=Asia/Ho_Chi_Minh 0 6 * * *'
  },
  async ({ step }) => {
    const now = new Date()
    const dayIndex = now.getDay() // 0 = Sunday, 1 = Monday, ...
    const dayString = DAY_OF_WEEK_MAP[dayIndex]
    const isWeekday = dayIndex >= 1 && dayIndex <= 5 // Monday - Friday

    // Calculate a stable, incrementing week number for the 'x-weeks' handler
    // This calculates the number of weeks that have passed since the Unix epoch
    const weekNumberSinceEpoch = Math.floor(now.getTime() / (1000 * 60 * 60 * 24 * 7))

    const boardsByHandlerType = await step.run('get-boards-by-handler-type', async () => {
      const boards = await prisma.board.findMany({
        where: {
          rules: {
            some: {
              category: ButlerCategory.SCHEDULED,
              isEnabled: true,
              isDeleted: false
            }
          }
        },
        select: {
          id: true,
          rules: {
            where: {
              category: ButlerCategory.SCHEDULED,
              isEnabled: true,
              isDeleted: false
            },
            select: {
              handlerKey: true
            }
          }
        }
      })

      const dailyBoards: typeof boards = []
      const weeklyBoards: typeof boards = []
      const xWeeksBoards: typeof boards = []

      for (const board of boards) {
        const handlerKeys = new Set(board.rules.map((r) => r.handlerKey))

        if (handlerKeys.has('WHEN_SCHEDULED_DAILY')) {
          dailyBoards.push(board)
        }
        if (handlerKeys.has('WHEN_SCHEDULED_WEEKLY')) {
          weeklyBoards.push(board)
        }
        if (handlerKeys.has('WHEN_SCHEDULED_X_WEEKS')) {
          xWeeksBoards.push(board)
        }
      }

      return [dailyBoards, weeklyBoards, xWeeksBoards]
    })

    const [dailyBoards, weeklyBoards, xWeeksBoards] = boardsByHandlerType

    const eventsToSend = []

    for (const board of dailyBoards) {
      eventsToSend.push({
        name: 'app/scheduled.daily',
        data: {
          boardId: board.id,
          interval: IntervalOption.DAY
        }
      })

      if (isWeekday) {
        eventsToSend.push({
          name: 'app/scheduled.daily',
          data: {
            boardId: board.id,
            interval: IntervalOption.WEEKDAY
          }
        })
      }
    }

    for (const board of weeklyBoards) {
      eventsToSend.push({
        name: 'app/scheduled.weekly',
        data: {
          boardId: board.id,
          day: dayString
        }
      })
    }

    for (const board of xWeeksBoards) {
      eventsToSend.push({
        name: 'app/scheduled.x-weeks',
        data: {
          boardId: board.id,
          day: dayString,
          weekNumber: weekNumberSinceEpoch
        }
      })
    }

    if (eventsToSend.length === 0) {
      return {
        success: true,
        message: 'No scheduled butlers to trigger today.',
        stats: {
          dailyBoards: 0,
          weeklyBoards: 0,
          xWeeksBoards: 0,
          totalEvents: 0
        }
      }
    }

    await step.sendEvent('fan-out-scheduled-jobs', eventsToSend)

    return {
      success: true,
      message: `Successfully fanned out ${eventsToSend.length} scheduled events.`,
      stats: {
        dailyBoards: dailyBoards.length,
        weeklyBoards: weeklyBoards.length,
        xWeeksBoards: xWeeksBoards.length,
        totalEvents: eventsToSend.length,
        timestamp: new Date().toISOString()
      }
    }
  }
)
