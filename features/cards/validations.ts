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
  newPosition: z.number(),
  slug: z.string().min(1, 'Slug không được để trống')
})

export const moveCardBetweenListsSchema = z.object({
  cardId: z.uuid(),
  sourceListId: z.uuid(),
  targetListId: z.uuid(),
  newPosition: z.number(),
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

    let parsedStartDate: Date | null = null
    if (data.startDate) {
      parsedStartDate = parse(data.startDate, 'MM/dd/yyyy', new Date())

      if (!isValid(parsedStartDate)) {
        ctx.addIssue({
          code: 'custom',
          message: 'Ngày bắt đầu không hợp lệ',
          path: ['startDate']
        })
        return
      }
    }

    let parsedEndDate: Date | null = null
    if (data.endDate) {
      parsedEndDate = parse(data.endDate, 'MM/dd/yyyy', new Date())

      if (!isValid(parsedEndDate)) {
        ctx.addIssue({
          code: 'custom',
          message: 'Ngày kết thúc không hợp lệ',
          path: ['endDate']
        })
        return
      }

      if (isBefore(parsedEndDate, today) && !isSameDay(parsedEndDate, today)) {
        ctx.addIssue({
          code: 'custom',
          message: 'Ngày kết thúc không thể là ngày trong quá khứ',
          path: ['endDate']
        })
      }

      // Validate endTime is required when endDate is provided
      if (!data.endTime) {
        ctx.addIssue({
          code: 'custom',
          message: 'Thời gian kết thúc không được để trống khi có ngày kết thúc',
          path: ['endTime']
        })
        return
      }
    }

    let parsedEndDateTime: Date | null = null
    if (data.endTime) {
      if (!data.endDate) {
        ctx.addIssue({
          code: 'custom',
          message: 'Không thể có thời gian kết thúc mà không có ngày kết thúc',
          path: ['endTime']
        })
        return
      }

      // Validate time format
      const timePattern = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/
      const timeMatch = data.endTime.match(timePattern)

      if (!timeMatch) {
        ctx.addIssue({
          code: 'custom',
          message: 'Định dạng thời gian không hợp lệ (H:mm)',
          path: ['endTime']
        })
        return
      }

      if (parsedEndDate) {
        parsedEndDateTime = parse(`${data.endDate} ${data.endTime}`, 'MM/dd/yyyy H:mm', new Date())

        if (!isValid(parsedEndDateTime)) {
          ctx.addIssue({
            code: 'custom',
            message: 'Ngày và thời gian kết thúc không hợp lệ',
            path: ['endTime']
          })
          return
        }

        if (isBefore(parsedEndDateTime, now)) {
          ctx.addIssue({
            code: 'custom',
            message: 'Thời gian kết thúc không thể là thời điểm trong quá khứ',
            path: ['endTime']
          })
        }
      }
    }

    if (parsedStartDate && parsedEndDate && isAfter(parsedStartDate, parsedEndDate)) {
      ctx.addIssue({
        code: 'custom',
        message: 'Ngày bắt đầu phải trước ngày kết thúc',
        path: ['startDate']
      })
    }

    if (data.reminderType !== 'NONE') {
      if (!data.endDate) {
        ctx.addIssue({
          code: 'custom',
          message: 'Nhắc nhở cần có ngày kết thúc',
          path: ['reminderType']
        })
        return
      }

      if (!data.endTime) {
        ctx.addIssue({
          code: 'custom',
          message: 'Nhắc nhở cần có thời gian kết thúc',
          path: ['reminderType']
        })
        return
      }

      if (parsedEndDateTime && isValid(parsedEndDateTime)) {
        let reminderDateTime = parsedEndDateTime

        // Calculate reminder time based on type
        switch (data.reminderType) {
          case 'FIVE_MINUTES_BEFORE':
            reminderDateTime = subMinutes(parsedEndDateTime, 5)
            break
          case 'TEN_MINUTES_BEFORE':
            reminderDateTime = subMinutes(parsedEndDateTime, 10)
            break
          case 'FIFTEEN_MINUTES_BEFORE':
            reminderDateTime = subMinutes(parsedEndDateTime, 15)
            break
          case 'ONE_HOUR_BEFORE':
            reminderDateTime = subHours(parsedEndDateTime, 1)
            break
          case 'TWO_HOURS_BEFORE':
            reminderDateTime = subHours(parsedEndDateTime, 2)
            break
          case 'ONE_DAY_BEFORE':
            reminderDateTime = subDays(parsedEndDateTime, 1)
            break
          case 'TWO_DAYS_BEFORE':
            reminderDateTime = subDays(parsedEndDateTime, 2)
            break
          case 'EXPIRED_DATE':
            reminderDateTime = parsedEndDateTime
            break
        }

        // Validate reminder time is not in the past (except for EXPIRED_DATE)
        if (data.reminderType !== 'EXPIRED_DATE' && isBefore(reminderDateTime, now)) {
          ctx.addIssue({
            code: 'custom',
            message: 'Thời gian nhắc nhở đã qua. Vui lòng chọn thời gian khác.',
            path: ['reminderType']
          })
        }
      }
    }
  })
  .transform((data) => {
    const result = {
      ...data,
      parsedStartDate: undefined as Date | undefined,
      parsedEndDateTime: undefined as Date | undefined
    }

    if (data.startDate) {
      result.parsedStartDate = parse(data.startDate, 'MM/dd/yyyy', new Date())
    }

    if (data.endDate && data.endTime) {
      result.parsedEndDateTime = parse(`${data.endDate} ${data.endTime}`, 'MM/dd/yyyy H:mm', new Date())
    }

    return result
  })

export const deleteCardDateSchema = z.object({
  cardSlug: z.string(),
  boardSlug: z.string()
})

export const updateCardBackgroundSchema = z.object({
  cardSlug: z.string(),
  boardSlug: z.string(),
  imageUrl: z.url()
})

export const toggleWatchCardSchema = z.object({
  cardSlug: z.string(),
  boardSlug: z.string()
})

export const toggleAssignCardSchema = z.object({
  cardSlug: z.string(),
  boardSlug: z.string(),
  targetId: z.uuid()
})

export type CreateCardSchema = z.infer<typeof createCardSchema>
export type MoveCardWithinListSchema = z.infer<typeof moveCardWithinListSchema>
export type MoveCardBetweenListsSchema = z.infer<typeof moveCardBetweenListsSchema>
export type UpdateCardSchema = z.infer<typeof updateCardSchema>

export type UpdateCardDateInputSchema = z.input<typeof updateCardDateSchema>
export type UpdateCardDateOutputSchema = z.output<typeof updateCardDateSchema>

export type DeleteCardDateSchema = z.infer<typeof deleteCardDateSchema>
export type UpdateCardBackgroundSchema = z.infer<typeof updateCardBackgroundSchema>
export type ToggleWatchCardSchema = z.infer<typeof toggleWatchCardSchema>
export type ToggleAssignCardSchema = z.infer<typeof toggleAssignCardSchema>
