import { ButlerCategory } from '@prisma/client'
import {
  ByOption,
  CardCreationTypeOption,
  DayOption,
  IntervalOption,
  MemberAssignmentOption,
  MoveCardActionOption,
  MoveCopyOption,
  Option,
  PositionOption,
  StatusOption
} from './types'
import {
  createBySelector,
  createDaySelector,
  createListCombobox,
  createMemberAssignmentSelector,
  createMoveCardActionSelector,
  createMoveCopySelector,
  createPositionSelector,
  createTextDisplay,
  createTextInput
} from './utils'

export const byOptions: Option<ByOption>[] = [
  { label: 'by me', value: ByOption.ME },
  { label: 'by anyone', value: ByOption.ANYONE },
  { label: 'by anyone except me', value: ByOption.ANYONE_EXCEPT_ME }
]

export const dayOptions: Option<DayOption>[] = [
  { label: 'monday', value: DayOption.MON },
  { label: 'tuesday', value: DayOption.TUE },
  { label: 'wednesday', value: DayOption.WED },
  { label: 'thursday', value: DayOption.THU },
  { label: 'friday', value: DayOption.FRI },
  { label: 'saturday', value: DayOption.SAT },
  { label: 'sunday', value: DayOption.SUN }
]

export const intervalOptions: Option<IntervalOption>[] = [
  { label: 'day', value: IntervalOption.DAY },
  { label: 'weekday', value: IntervalOption.WEEKDAY }
]

export const statusOptions: Option<StatusOption>[] = [
  { label: 'complete', value: StatusOption.COMPLETE },
  { label: 'incomplete', value: StatusOption.INCOMPLETE }
]

export const moveCopyOptions: Option<MoveCopyOption>[] = [
  { label: 'move', value: MoveCopyOption.MOVE },
  { label: 'copy', value: MoveCopyOption.COPY }
]

export const positionOptions: Option<PositionOption>[] = [
  { label: 'to the top of list', value: PositionOption.TOP },
  { label: 'to the bottom of list', value: PositionOption.BOTTOM }
]

export const moveCardActionOptions: Option<MoveCardActionOption>[] = [
  { label: 'to the top of the list', value: MoveCardActionOption.TOP_CURRENT },
  { label: 'to the bottom of the list', value: MoveCardActionOption.BOTTOM_CURRENT },
  { label: 'the next list on the board', value: MoveCardActionOption.NEXT },
  { label: 'the previous list on the board', value: MoveCardActionOption.PREVIOUS }
]

export const memberAssignmentOptions: Option<MemberAssignmentOption>[] = [
  { label: 'at random', value: MemberAssignmentOption.RANDOM },
  { label: 'in turn', value: MemberAssignmentOption.TURN }
]

export const cardCreationTypeOptions: Option<CardCreationTypeOption>[] = [
  { label: 'a new', value: CardCreationTypeOption.NEW },
  { label: 'a unique', value: CardCreationTypeOption.UNIQUE }
]

// Use 'as const' so TS treats values as literals (e.g. 'rule'), not string — helps auto-infer types for future templates.
export const ruleTriggerTemplates = [
  {
    id: 't-card-created' as const,
    category: ButlerCategory.RULE,
    handlerKey: 'WHEN_CARD_CREATED' as const,
    parts: [
      createTextDisplay('t-card-created-text-display', 'when a card is created in the board'),
      createBySelector('t-card-created-by')
    ]
  },
  {
    id: 't-card-added-to-list' as const,
    category: ButlerCategory.RULE,
    handlerKey: 'WHEN_CARD_ADDED_TO_LIST' as const,
    parts: [
      createTextDisplay('t-card-added-to-list-text-display', 'when a card is added to list'),
      createListCombobox('t-card-added-to-list-listId'),
      createBySelector('t-card-added-to-list-by')
    ]
  },
  {
    id: 't-list-created' as const,
    category: ButlerCategory.RULE,
    handlerKey: 'WHEN_LIST_CREATED' as const,
    parts: [
      createTextDisplay('t-list-created-text-display', 'when list is created by'),
      createBySelector('t-list-created-by')
    ]
  },
  {
    id: 't-card-marked-complete' as const,
    category: ButlerCategory.RULE,
    handlerKey: 'WHEN_CARD_MARKED_COMPLETE' as const,
    parts: [
      createTextDisplay('t-card-marked-complete-text-display', 'when the card is marked as'),
      {
        type: 'select',
        id: 't-card-marked-complete-status',
        defaultValue: 'complete',
        options: statusOptions
      },
      createBySelector('t-card-marked-complete-by')
    ]
  }
] as const

export const scheduledTriggerTemplates = [
  {
    id: 't-sched-every-day' as const,
    category: ButlerCategory.SCHEDULED,
    handlerKey: 'WHEN_SCHEDULED_DAILY' as const,
    parts: [
      createTextDisplay('t-sched-every-day-text-display', 'every'),
      {
        type: 'select',
        id: 't-sched-every-day-interval',
        options: intervalOptions
      }
    ]
  },
  {
    id: 't-sched-every-week-on' as const,
    category: ButlerCategory.SCHEDULED,
    handlerKey: 'WHEN_SCHEDULED_WEEKLY' as const,
    parts: [
      createTextDisplay('t-sched-every-week-on-text-display', 'every'),
      createDaySelector('t-sched-every-week-on-day')
    ]
  },
  {
    id: 't-sched-every-x-weeks' as const,
    category: ButlerCategory.SCHEDULED,
    handlerKey: 'WHEN_SCHEDULED_X_WEEKS' as const,
    parts: [
      createTextDisplay('t-sched-every-x-weeks-text-display-1', 'every'),
      {
        type: 'number-input',
        id: 't-sched-every-x-weeks-interval',
        placeholder: 'number',
        defaultValue: 2
      },
      createTextDisplay('t-sched-every-x-weeks-text-display-2', 'weeks on'),
      createDaySelector('t-sched-every-x-weeks-day')
    ]
  }
]

export const ruleActionTemplates = [
  {
    id: 'a-move-copy-card-to-list' as const,
    category: ButlerCategory.RULE,
    handlerKey: 'MOVE_COPY_CARD_TO_LIST' as const,
    parts: [
      createMoveCopySelector('a-move-copy-card-to-list-action'),
      createTextDisplay('a-move-copy-card-to-list-text-display', 'the card'),
      createPositionSelector('a-move-copy-card-to-list-position'),
      createListCombobox('a-move-copy-card-to-list-listId')
    ]
  },
  {
    id: 'a-move-card' as const,
    category: ButlerCategory.RULE,
    handlerKey: 'MOVE_CARD' as const,
    parts: [
      createTextDisplay('a-move-card-text-display', 'move the card'),
      createMoveCardActionSelector('a-move-card-action')
    ]
  },
  {
    id: 'a-mark-card-status' as const,
    category: ButlerCategory.RULE,
    handlerKey: 'MARK_CARD_STATUS' as const,
    parts: [
      createTextDisplay('a-mark-card-status-text-display', 'mark the card as'),
      {
        type: 'select',
        id: 'a-mark-card-status-status',
        defaultValue: 'complete',
        options: statusOptions
      }
    ]
  },
  {
    id: 'a-add-member' as const,
    category: ButlerCategory.RULE,
    handlerKey: 'ADD_MEMBER' as const,
    parts: [
      createTextDisplay('a-add-member-text-display', 'add member'),
      createMemberAssignmentSelector('a-add-member-assignment'),
      createTextDisplay('a-add-member-text-display-2', 'to the card')
    ]
  }
] as const

export const scheduledActionTemplates = [
  {
    id: 'a-create-card' as const,
    category: ButlerCategory.SCHEDULED,
    handlerKey: 'CREATE_CARD' as const,
    parts: [
      createTextDisplay('a-create-card-text-display', 'create'),
      {
        type: 'select',
        id: 'a-create-card-type',
        defaultValue: 'new',
        options: cardCreationTypeOptions
      },
      createTextDisplay('a-create-card-text-display-2', 'card with title'),
      createTextInput('a-create-card-title'),
      createTextDisplay('a-create-card-text-display-3', 'in list'),
      createListCombobox('a-create-card-listId')
    ]
  },
  {
    id: 'a-move-copy-all-cards' as const,
    category: ButlerCategory.SCHEDULED,
    handlerKey: 'MOVE_COPY_ALL_CARDS' as const,
    parts: [
      createMoveCopySelector('a-move-copy-all-cards-action'),
      createTextDisplay('a-move-copy-all-cards-text-display', 'all the cards in list'),
      createListCombobox('a-move-copy-all-cards-fromListId'),
      createTextDisplay('a-move-copy-all-cards-text-display-2', 'to list'),
      createListCombobox('a-move-copy-all-cards-toListId')
    ]
  }
] as const

export const triggerTemplates = [...ruleTriggerTemplates, ...scheduledTriggerTemplates] as const
export const actionTemplates = [...ruleActionTemplates, ...scheduledActionTemplates] as const

// Auto-infer types from templates
export type TemplateId = (typeof triggerTemplates)[number]['id'] | (typeof actionTemplates)[number]['id']
export type PartId =
  | (typeof triggerTemplates)[number]['parts'][number]['id']
  | (typeof actionTemplates)[number]['parts'][number]['id']
