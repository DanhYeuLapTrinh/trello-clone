import { ButlerCategory, HandlerKey } from '@prisma/client'
import z from 'zod'
import { TemplateId } from '../types'

const fieldSchemas = {
  textDisplay: z.object({
    type: z.literal('text-display'),
    value: z.string()
  }),
  textInput: z.object({
    type: z.literal('text-input'),
    value: z.string()
  }),
  numberInput: z.object({
    type: z.literal('number-input'),
    value: z.number()
  }),
  select: z.object({
    type: z.literal('select'),
    value: z.string()
  }),
  listCombobox: z.object({
    type: z.literal('list-combobox'),
    value: z.uuid()
  })
} as const

/**
 * Factory function to create a Zod schema for a single trigger.
 * Using generics (e.g., `TemplateId extends string`) is crucial.
 * It makes TypeScript infer the *literal* value (e.g., 't-card-created') instead of the *general* type (e.g., string).
 *
 * This is required for the `discriminatedUnion` to work, which relies on a key (our 'handlerKey') having a *specific
 * literal type* (not just `string`) to select the correct schema.
 */
export const createButler = <
  TTemplateId extends TemplateId,
  THandlerKey extends HandlerKey,
  TCategory extends ButlerCategory,
  TFields extends z.ZodRawShape
>(
  templateId: TTemplateId,
  handlerKey: THandlerKey,
  category: TCategory,
  fields: TFields
) =>
  z.object({
    templateId: z.literal(templateId),
    handlerKey: z.literal(handlerKey),
    category: z.literal(category),
    fields: z.object(fields)
  })

// Schemas
const whenCardCreatedSchema = createButler('t-card-created', HandlerKey.WHEN_CARD_CREATED, ButlerCategory.RULE, {
  't-card-created-text-display': fieldSchemas.textDisplay,
  't-card-created-by': fieldSchemas.select
})

const whenCardAddedToListSchema = createButler(
  't-card-added-to-list',
  HandlerKey.WHEN_CARD_ADDED_TO_LIST,
  ButlerCategory.RULE,
  {
    't-card-added-to-list-text-display': fieldSchemas.textDisplay,
    't-card-added-to-list-listId': fieldSchemas.listCombobox,
    't-card-added-to-list-by': fieldSchemas.select
  }
)

const whenListCreatedSchema = createButler('t-list-created', HandlerKey.WHEN_LIST_CREATED, ButlerCategory.RULE, {
  't-list-created-text-display': fieldSchemas.textDisplay,
  't-list-created-by': fieldSchemas.select
})

const whenCardMarkedCompleteSchema = createButler(
  't-card-marked-complete',
  HandlerKey.WHEN_CARD_MARKED_COMPLETE,
  ButlerCategory.RULE,
  {
    't-card-marked-complete-text-display': fieldSchemas.textDisplay,
    't-card-marked-complete-status': fieldSchemas.select,
    't-card-marked-complete-by': fieldSchemas.select
  }
)

const whenScheduledDailySchema = createButler(
  't-sched-every-day',
  HandlerKey.WHEN_SCHEDULED_DAILY,
  ButlerCategory.SCHEDULED,
  {
    't-sched-every-day-text-display': fieldSchemas.textDisplay,
    't-sched-every-day-interval': fieldSchemas.select
  }
)

const whenScheduledWeeklySchema = createButler(
  't-sched-every-week-on',
  HandlerKey.WHEN_SCHEDULED_WEEKLY,
  ButlerCategory.SCHEDULED,
  {
    't-sched-every-week-on-text-display': fieldSchemas.textDisplay,
    't-sched-every-week-on-day': fieldSchemas.select
  }
)

const whenScheduledXWeeksSchema = createButler(
  't-sched-every-x-weeks',
  HandlerKey.WHEN_SCHEDULED_X_WEEKS,
  ButlerCategory.SCHEDULED,
  {
    't-sched-every-x-weeks-text-display-1': fieldSchemas.textDisplay,
    't-sched-every-x-weeks-interval': fieldSchemas.numberInput,
    't-sched-every-x-weeks-text-display-2': fieldSchemas.textDisplay,
    't-sched-every-x-weeks-day': fieldSchemas.select
  }
)

const moveCopyCardToListSchema = createButler(
  'a-move-copy-card-to-list',
  HandlerKey.MOVE_COPY_CARD_TO_LIST,
  ButlerCategory.RULE,
  {
    'a-move-copy-card-to-list-action': fieldSchemas.select,
    'a-move-copy-card-to-list-text-display': fieldSchemas.textDisplay,
    'a-move-copy-card-to-list-position': fieldSchemas.select,
    'a-move-copy-card-to-list-listId': fieldSchemas.listCombobox
  }
)

const moveCardSchema = createButler('a-move-card', HandlerKey.MOVE_CARD, ButlerCategory.RULE, {
  'a-move-card-text-display': fieldSchemas.textDisplay,
  'a-move-card-action': fieldSchemas.select
})

const markCardStatusSchema = createButler('a-mark-card-status', HandlerKey.MARK_CARD_STATUS, ButlerCategory.RULE, {
  'a-mark-card-status-text-display': fieldSchemas.textDisplay,
  'a-mark-card-status-status': fieldSchemas.select
})

const addMemberSchema = createButler('a-add-member', HandlerKey.ADD_MEMBER, ButlerCategory.RULE, {
  'a-add-member-text-display': fieldSchemas.textDisplay,
  'a-add-member-assignment': fieldSchemas.select,
  'a-add-member-text-display-2': fieldSchemas.textDisplay
})

const createCardSchema = createButler('a-create-card', HandlerKey.CREATE_CARD, ButlerCategory.SCHEDULED, {
  'a-create-card-text-display': fieldSchemas.textDisplay,
  'a-create-card-type': fieldSchemas.select,
  'a-create-card-text-display-2': fieldSchemas.textDisplay,
  'a-create-card-title': fieldSchemas.textInput,
  'a-create-card-text-display-3': fieldSchemas.textDisplay,
  'a-create-card-listId': fieldSchemas.listCombobox
})

const moveCopyAllCardsSchema = createButler(
  'a-move-copy-all-cards',
  HandlerKey.MOVE_COPY_ALL_CARDS,
  ButlerCategory.SCHEDULED,
  {
    'a-move-copy-all-cards-action': fieldSchemas.select,
    'a-move-copy-all-cards-text-display': fieldSchemas.textDisplay,
    'a-move-copy-all-cards-fromListId': fieldSchemas.listCombobox,
    'a-move-copy-all-cards-text-display-2': fieldSchemas.textDisplay,
    'a-move-copy-all-cards-toListId': fieldSchemas.listCombobox
  }
)

// Use the 'handlerKey' field to decide which schema to use
export const automationTriggerSchema = z.discriminatedUnion('handlerKey', [
  whenCardCreatedSchema,
  whenCardAddedToListSchema,
  whenListCreatedSchema,
  whenCardMarkedCompleteSchema,
  whenScheduledDailySchema,
  whenScheduledWeeklySchema,
  whenScheduledXWeeksSchema
])

export const automationActionSchema = z.discriminatedUnion('handlerKey', [
  moveCopyCardToListSchema,
  moveCardSchema,
  markCardStatusSchema,
  addMemberSchema,
  createCardSchema,
  moveCopyAllCardsSchema
])

export const createRuleSchema = z.object({
  trigger: automationTriggerSchema,
  actions: z.array(automationActionSchema).min(1, 'At least one action is required')
})

export type AutomationTriggerSchema = z.infer<typeof automationTriggerSchema>
export type AutomationActionSchema = z.infer<typeof automationActionSchema>
export type CreateRuleSchema = z.infer<typeof createRuleSchema>
