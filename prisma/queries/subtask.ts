import { Prisma } from '@prisma/client'

// Select
export const subtaskSelect = {
  id: true,
  title: true,
  isDone: true
} satisfies Prisma.SubtaskSelect

export const subtaskDetailSelect = {
  ...subtaskSelect,
  children: {
    select: subtaskSelect
  }
} satisfies Prisma.SubtaskSelect

// Types
export type UISubtask = Prisma.SubtaskGetPayload<{
  select: typeof subtaskSelect
}>

export type SubtaskDetail = Prisma.SubtaskGetPayload<{
  select: typeof subtaskDetailSelect
}>
