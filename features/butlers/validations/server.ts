import { ButlerCategory, HandlerKey } from '@prisma/client'
import z from 'zod'
import {
  ByOption,
  CardCreationTypeOption,
  DayOption,
  IntervalOption,
  ListPositionOption,
  MemberAssignmentOption,
  MoveCardActionOption,
  MoveCopyOption,
  PositionOption,
  StatusOption
} from '../types'

const byFieldSchema = z.enum(ByOption)
const statusFieldSchema = z.enum(StatusOption)
const dayFieldSchema = z.enum(DayOption)
const intervalFieldSchema = z.enum(IntervalOption)
const moveCopyFieldSchema = z.enum(MoveCopyOption)
const positionFieldSchema = z.enum(PositionOption)
const listPositionFieldSchema = z.enum(ListPositionOption)
const moveCardActionFieldSchema = z.enum(MoveCardActionOption)
const memberAssignmentFieldSchema = z.enum(MemberAssignmentOption)
const cardCreationTypeFieldSchema = z.enum(CardCreationTypeOption)

// Schemas
const whenCardCreatedTriggerSchema = z.object({
  handlerKey: z.literal('WHEN_CARD_CREATED'),
  category: z.literal(ButlerCategory.RULE),
  by: byFieldSchema
})

const whenCardAddedToListTriggerSchema = z.object({
  handlerKey: z.literal('WHEN_CARD_ADDED_TO_LIST'),
  category: z.literal(ButlerCategory.RULE),
  listId: z.uuid(),
  by: byFieldSchema
})

const whenListCreatedTriggerSchema = z.object({
  handlerKey: z.literal('WHEN_LIST_CREATED'),
  category: z.literal(ButlerCategory.RULE),
  by: byFieldSchema
})

const whenCardMarkedCompleteTriggerSchema = z.object({
  handlerKey: z.literal('WHEN_CARD_MARKED_COMPLETE'),
  category: z.literal(ButlerCategory.RULE),
  status: statusFieldSchema,
  by: byFieldSchema
})

const whenScheduledDailyTriggerSchema = z.object({
  handlerKey: z.literal('WHEN_SCHEDULED_DAILY'),
  category: z.literal(ButlerCategory.SCHEDULED),
  interval: intervalFieldSchema
})

const whenScheduledWeeklyTriggerSchema = z.object({
  handlerKey: z.literal('WHEN_SCHEDULED_WEEKLY'),
  category: z.literal(ButlerCategory.SCHEDULED),
  day: dayFieldSchema
})

const whenScheduledXWeeksTriggerSchema = z.object({
  handlerKey: z.literal('WHEN_SCHEDULED_X_WEEKS'),
  category: z.literal(ButlerCategory.SCHEDULED),
  interval: z.number().int().positive(),
  day: dayFieldSchema
})

const moveCopyCardToListActionSchema = z.object({
  handlerKey: z.literal('MOVE_COPY_CARD_TO_LIST'),
  category: z.literal(ButlerCategory.RULE),
  action: moveCopyFieldSchema,
  position: positionFieldSchema,
  listId: z.uuid()
})

const moveCardActionSchema = z.object({
  handlerKey: z.literal('MOVE_CARD'),
  category: z.literal(ButlerCategory.RULE),
  action: moveCardActionFieldSchema
})

const markCardStatusActionSchema = z.object({
  handlerKey: z.literal('MARK_CARD_STATUS'),
  category: z.literal(ButlerCategory.RULE),
  status: statusFieldSchema
})

const addMemberActionSchema = z.object({
  handlerKey: z.literal('ADD_MEMBER'),
  category: z.literal(ButlerCategory.RULE),
  assignment: memberAssignmentFieldSchema
})

const createCardActionSchema = z.object({
  handlerKey: z.literal('CREATE_CARD'),
  category: z.literal(ButlerCategory.SCHEDULED),
  type: cardCreationTypeFieldSchema,
  title: z.string().min(1, 'Card title is required'),
  listId: z.uuid()
})

const moveCopyAllCardsActionSchema = z.object({
  handlerKey: z.literal('MOVE_COPY_ALL_CARDS'),
  category: z.literal(ButlerCategory.SCHEDULED),
  action: moveCopyFieldSchema,
  fromListId: z.uuid(),
  toListId: z.uuid()
})

const moveListActionSchema = z.object({
  handlerKey: z.literal('MOVE_LIST'),
  category: z.literal(ButlerCategory.RULE),
  position: listPositionFieldSchema
})

export const triggerSchema = z.discriminatedUnion('handlerKey', [
  whenCardCreatedTriggerSchema,
  whenCardAddedToListTriggerSchema,
  whenListCreatedTriggerSchema,
  whenCardMarkedCompleteTriggerSchema,
  whenScheduledDailyTriggerSchema,
  whenScheduledWeeklyTriggerSchema,
  whenScheduledXWeeksTriggerSchema
])

export const actionSchema = z.discriminatedUnion('handlerKey', [
  moveCopyCardToListActionSchema,
  moveCardActionSchema,
  markCardStatusActionSchema,
  addMemberActionSchema,
  createCardActionSchema,
  moveCopyAllCardsActionSchema,
  moveListActionSchema
])

export const createButlerSchema = z.object({
  boardSlug: z.string(),
  category: z.enum(ButlerCategory),
  handlerKey: z.enum(HandlerKey),
  trigger: triggerSchema,
  actions: z.array(actionSchema).min(1, 'At least one action is required')
})

export type TriggerSchema = z.infer<typeof triggerSchema>
export type ActionSchema = z.infer<typeof actionSchema>
export type CreateButlerSchema = z.infer<typeof createButlerSchema>
