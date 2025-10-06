import { CardReminderType } from '@prisma/client'
import z from 'zod'

export const cardReminderSchema = z.object({
  cardId: z.uuid(),
  boardId: z.uuid(),
  endDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid ISO date'
  }),
  reminderType: z.enum(CardReminderType),
  reminderDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid ISO date'
  }),
  recipients: z.array(z.uuid()).min(1)
})

export type CardReminderSchema = z.infer<typeof cardReminderSchema>
