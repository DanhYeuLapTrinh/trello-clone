import { CardReminderType } from '@prisma/client'
import { isAfter, isBefore, isSameDay, isValid, parse, startOfToday, subDays, subHours, subMinutes } from 'date-fns'
import z from 'zod'

export const createCardSchema = z.object({
  title: z.string().min(1, 'Tên thẻ không được để trống'),
  slug: z.string().min(1, 'Slug không được để trống'),
  listId: z.uuid()
})

export const moveCardWithinListSchema = z.object({
  cardId: z.uuid(),
  listId: z.uuid(),
  newPosition: z.number().min(0, 'Vị trí phải lớn hơn hoặc bằng 0'),
  slug: z.string().min(1, 'Slug không được để trống')
})

export const moveCardBetweenListsSchema = z.object({
  cardId: z.uuid(),
  sourceListId: z.uuid(),
  targetListId: z.uuid(),
  newPosition: z.number().min(0, 'Vị trí phải lớn hơn hoặc bằng 0'),
  slug: z.string().min(1, 'Slug không được để trống')
})

export const updateCardSchema = z.object({
  cardId: z.uuid(),
  title: z.string().optional(),
  description: z.string().optional(),
  boardSlug: z.string()
})

export const updateCardDateSchema = z
  .object({
    cardSlug: z.string(),
    boardSlug: z.string(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    endTime: z.string().optional(),
    reminderType: z.enum(CardReminderType)
  })
  .superRefine((data, ctx) => {
    const now = new Date()
    const today = startOfToday()

    if (data.startDate) {
      const startDate = parse(data.startDate, 'MM/dd/yyyy', new Date())

      if (!isValid(startDate)) {
        ctx.addIssue({
          code: 'custom',
          message: 'Ngày bắt đầu không hợp lệ',
          path: ['startDate']
        })
      }
    }

    if (data.endDate) {
      const endDate = parse(data.endDate, 'MM/dd/yyyy', new Date())

      if (!isValid(endDate)) {
        ctx.addIssue({
          code: 'custom',
          message: 'Ngày kết thúc không hợp lệ',
          path: ['endDate']
        })
      } else if (isBefore(endDate, today) && !isSameDay(endDate, today)) {
        ctx.addIssue({
          code: 'custom',
          message: 'Ngày kết thúc không thể là ngày trong quá khứ',
          path: ['endDate']
        })
      }

      if (!data.endTime) {
        ctx.addIssue({
          code: 'custom',
          message: 'Thời gian kết thúc không được để trống khi có ngày kết thúc',
          path: ['endTime']
        })
      } else {
        // Check if the combined endDate + endTime is not in the past
        const timePattern = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/
        const timeMatch = data.endTime.match(timePattern)

        if (!timeMatch) {
          ctx.addIssue({
            code: 'custom',
            message: 'Định dạng thời gian không hợp lệ (H:mm)',
            path: ['endTime']
          })
        } else {
          const endDateTime = parse(`${data.endDate} ${data.endTime}`, 'MM/dd/yyyy H:mm', new Date())

          if (isValid(endDateTime) && isBefore(endDateTime, now)) {
            ctx.addIssue({
              code: 'custom',
              message: 'Thời gian kết thúc không thể là thời điểm trong quá khứ',
              path: ['endTime']
            })
          }
        }
      }
    }

    if (data.startDate && data.endDate) {
      const startDate = parse(data.startDate, 'MM/dd/yyyy', new Date())
      const endDate = parse(data.endDate, 'MM/dd/yyyy', new Date())

      if (isValid(startDate) && isValid(endDate) && isAfter(startDate, endDate)) {
        ctx.addIssue({
          code: 'custom',
          message: 'Ngày bắt đầu phải trước ngày kết thúc',
          path: ['startDate']
        })
      }
    }

    // Only validate reminder if it's not NONE and we have date/time data
    if (data.reminderType !== 'NONE') {
      if (!data.endDate) {
        ctx.addIssue({
          code: 'custom',
          message: 'Nhắc nhở cần có ngày kết thúc',
          path: ['reminderType']
        })
      } else if (!data.endTime) {
        ctx.addIssue({
          code: 'custom',
          message: 'Nhắc nhở cần có thời gian kết thúc',
          path: ['reminderType']
        })
      } else {
        const endDateTime = parse(`${data.endDate} ${data.endTime}`, 'MM/dd/yyyy H:mm', new Date())

        if (isValid(endDateTime)) {
          let reminderDateTime = endDateTime

          switch (data.reminderType) {
            case 'FIVE_MINUTES_BEFORE':
              reminderDateTime = subMinutes(endDateTime, 5)
              break
            case 'TEN_MINUTES_BEFORE':
              reminderDateTime = subMinutes(endDateTime, 10)
              break
            case 'FIFTEEN_MINUTES_BEFORE':
              reminderDateTime = subMinutes(endDateTime, 15)
              break
            case 'ONE_HOUR_BEFORE':
              reminderDateTime = subHours(endDateTime, 1)
              break
            case 'TWO_HOURS_BEFORE':
              reminderDateTime = subHours(endDateTime, 2)
              break
            case 'ONE_DAY_BEFORE':
              reminderDateTime = subDays(endDateTime, 1)
              break
            case 'TWO_DAYS_BEFORE':
              reminderDateTime = subDays(endDateTime, 2)
              break
            case 'EXPIRED_DATE':
              // No adjustment needed for expired date reminder
              reminderDateTime = endDateTime
              break
          }

          // Check if reminder time is in the past (except for EXPIRED_DATE)
          if (data.reminderType !== 'EXPIRED_DATE' && isBefore(reminderDateTime, now)) {
            ctx.addIssue({
              code: 'custom',
              message: 'Thời gian nhắc nhở đã qua.',
              path: ['reminderType']
            })
          }
        }
      }
    }

    // Validate endTime is not provided without endDate
    if (data.endTime && !data.endDate) {
      ctx.addIssue({
        code: 'custom',
        message: 'Không thể có thời gian kết thúc mà không có ngày kết thúc',
        path: ['endTime']
      })
    }
  })

export const deleteCardDateSchema = z.object({
  cardSlug: z.string(),
  boardSlug: z.string()
})

export type CreateCardSchema = z.infer<typeof createCardSchema>
export type MoveCardWithinListSchema = z.infer<typeof moveCardWithinListSchema>
export type MoveCardBetweenListsSchema = z.infer<typeof moveCardBetweenListsSchema>
export type UpdateCardSchema = z.infer<typeof updateCardSchema>
export type UpdateCardDateSchema = z.infer<typeof updateCardDateSchema>
export type DeleteCardDateSchema = z.infer<typeof deleteCardDateSchema>
