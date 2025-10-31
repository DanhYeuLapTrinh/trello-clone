import { getTempId } from '@/lib/utils'
import { Butler, ButlerCategory } from '@prisma/client'
import { QueryClient } from '@tanstack/react-query'
import {
  byOptions,
  cardCreationTypeOptions,
  dayOptions,
  intervalOptions,
  listPositionOptions,
  memberAssignmentOptions,
  moveCardActionOptions,
  moveCopyOptions,
  positionOptions,
  statusOptions
} from './constants'
import { ButlerData, FieldValue, Part, PartId } from './types'
import { AutomationActionSchema, AutomationTriggerSchema } from './validations/client'
import { ActionSchema, TriggerSchema } from './validations/server'

export const getInitialState = (parts: readonly Part[]) => {
  return parts.reduce(
    (acc, part) => {
      if ('id' in part && part.id) {
        acc[part.id] = {
          type: part.type,
          value: part.defaultValue
        }
      }
      return acc
    },
    {} as Partial<Record<PartId, { type: Part['type']; value: string | number | undefined }>>
  )
}

export const createTextDisplay = <T extends string>(id: T, text: string): Part => ({
  type: 'text-display',
  id,
  defaultValue: text
})

export const createTextInput = <T extends string>(id: T): Part => ({
  type: 'text-input',
  id,
  placeholder: 'Enter text...'
})

export const createBySelector = <T extends string>(id: T): Part => ({
  type: 'select',
  id,
  defaultValue: 'me',
  options: byOptions
})

export const createListCombobox = <T extends string>(id: T): Part => ({
  type: 'list-combobox',
  id,
  placeholder: 'List name'
})

export const createDaySelector = <T extends string>(id: T): Part => ({
  type: 'select',
  id,
  placeholder: 'select days',
  options: dayOptions
})

export const createMoveCopySelector = <T extends string>(id: T): Part => ({
  type: 'select',
  id,
  defaultValue: 'move',
  options: moveCopyOptions
})

export const createPositionSelector = <T extends string>(id: T): Part => ({
  type: 'select',
  id,
  defaultValue: 'top',
  options: positionOptions
})

export const createListPositionSelector = <T extends string>(id: T): Part => ({
  type: 'select',
  id,
  defaultValue: 'first',
  options: listPositionOptions
})

export const createMoveCardActionSelector = <T extends string>(id: T): Part => ({
  type: 'select',
  id,
  defaultValue: 'top-current',
  options: moveCardActionOptions
})

export const createMemberAssignmentSelector = <T extends string>(id: T): Part => ({
  type: 'select',
  id,
  defaultValue: 'random',
  options: memberAssignmentOptions
})

export const createCardCreationTypeSelector = <T extends string>(id: T): Part => ({
  type: 'select',
  id,
  defaultValue: 'new',
  options: cardCreationTypeOptions
})

export const getFieldFromTrigger = (trigger: AutomationTriggerSchema, fieldId: string) => {
  const fields = trigger.fields as Record<string, FieldValue>
  return fields[fieldId]
}

export const getFieldFromAction = (action: AutomationActionSchema, fieldId: string) => {
  const fields = action.fields as Record<string, FieldValue>
  return fields[fieldId]
}

/**
 * Transforms the form data into a backend-readable format for easy processing.
 * Extracts only the necessary values from fields and removes UI-specific metadata.
 
 * @example
 * // Input: When card added to "Done" by anyone, mark as complete and add member at random
 * {
 *   trigger: {
 *     handlerKey: 'WHEN_CARD_ADDED_TO_LIST',
 *     category: 'rule',
 *     listId: '789e0123-e89b-12d3-a456-426614174000',
 *     by: 'anyone'
 *   },
 *   actions: [
 *     {
 *       handlerKey: 'MARK_CARD_STATUS',
 *       category: 'rule',
 *       status: 'complete'
 *     },
 *     {
 *       handlerKey: 'ADD_MEMBER',
 *       category: 'rule',
 *       assignment: 'random'
 *     }
 *   ]
 * }
 */
export const transformRuleForBackend = (data: {
  trigger: AutomationTriggerSchema
  actions: AutomationActionSchema[]
}): ButlerData => {
  const extractFieldValues = (fields: Record<string, FieldValue>): Record<string, string | number> => {
    return Object.fromEntries(
      Object.entries(fields)
        // Remove text-display fields since they are only for UI
        .filter(([, fieldData]) => fieldData.type !== 'text-display')
        .map(([fieldId, fieldData]) => {
          // Format fieldName to exclude the template prefix. e.g., 't-card-created-by' -> 'by'
          const fieldName = fieldId.split('-').slice(-1)[0]
          return [fieldName, fieldData.value]
        })
    )
  }

  return {
    trigger: {
      handlerKey: data.trigger.handlerKey,
      category: data.trigger.category,
      ...extractFieldValues(data.trigger.fields as Record<string, FieldValue>)
    } as ButlerData['trigger'],
    actions: data.actions.map((action) => ({
      handlerKey: action.handlerKey,
      category: action.category,
      ...extractFieldValues(action.fields as Record<string, FieldValue>)
    })) as ButlerData['actions']
  }
}

/**
 * Transforms server-side trigger and actions into a human-readable description string.
 *
 * @param trigger - The trigger schema from the server
 * @param actions - Array of action schemas from the server
 * @param listMap - Optional map of list IDs to list names for resolving list references
 * @param creatorName - Optional name of the rule creator (replaces "me" with actual name)
 *
 * @example
 * const description = transformToReadableString(
 *   {
 *     handlerKey: 'WHEN_CARD_ADDED_TO_LIST',
 *     category: 'RULE',
 *     listId: '9a130680-ed71-4b65-99b1-db9d646e33fc',
 *     by: 'me'
 *   },
 *   [
 *     { handlerKey: 'MOVE_CARD', category: 'RULE', action: 'top-current' },
 *     { handlerKey: 'ADD_MEMBER', category: 'RULE', assignment: 'random' }
 *   ],
 *   { '9a130680-ed71-4b65-99b1-db9d646e33fc': 'Defined' },
 *   'John Doe'
 * )
 * // Returns: "when a card is added to list "Defined" by John Doe, move the card to the top of the list, and add member at random to the card"
 */
export const transformToReadableString = (
  trigger: TriggerSchema,
  actions: ActionSchema[],
  listMap?: Record<string, string>,
  creatorName?: string
): string => {
  const getListName = (listId: string | undefined): string => {
    if (!listId) return '[list]'
    return listMap?.[listId] ? `"${listMap[listId]}"` : '[list]'
  }

  const formatBy = (by: string | undefined): string => {
    const option = byOptions.find((opt) => opt.value === by)
    if (!option) return ''

    if (option.value === 'me' && creatorName) {
      return `by ${creatorName}`
    }

    if (option.value === 'anyone-except-me' && creatorName) {
      return `by anyone except ${creatorName}`
    }

    return option.label
  }

  const formatDay = (day: string | undefined): string => {
    const option = dayOptions.find((opt) => opt.value === day)
    return option ? option.label : ''
  }

  const formatInterval = (interval: string | undefined): string => {
    const option = intervalOptions.find((opt) => opt.value === interval)
    return option ? option.label : ''
  }

  // Transform trigger to readable string
  let triggerText = ''

  switch (trigger.handlerKey) {
    case 'WHEN_CARD_CREATED':
      triggerText = `when a card is created in the board ${formatBy(trigger.by as string)}`
      break
    case 'WHEN_CARD_ADDED_TO_LIST':
      triggerText = `when a card is added to list ${getListName(trigger.listId as string)} ${formatBy(trigger.by as string)}`
      break
    case 'WHEN_LIST_CREATED':
      triggerText = `when a list is created ${formatBy(trigger.by as string)}`
      break
    case 'WHEN_CARD_MARKED_COMPLETE': {
      const statusOption = statusOptions.find((opt) => opt.value === trigger.status)
      const statusLabel = statusOption ? statusOption.label : 'complete'
      triggerText = `when the card is marked as ${statusLabel} ${formatBy(trigger.by as string)}`
      break
    }
    case 'WHEN_SCHEDULED_DAILY':
      triggerText = `every ${formatInterval(trigger.interval as string)}`
      break
    case 'WHEN_SCHEDULED_WEEKLY':
      triggerText = `every ${formatDay(trigger.day as string)}`
      break
    case 'WHEN_SCHEDULED_X_WEEKS':
      triggerText = `every ${trigger.interval} weeks on ${formatDay(trigger.day as string)}`
      break
  }

  // Transform actions to readable strings
  const actionTexts = actions.map((action) => {
    switch (action.handlerKey) {
      case 'MOVE_COPY_CARD_TO_LIST': {
        const moveCopyOption = moveCopyOptions.find((opt) => opt.value === action.action)
        const positionOption = positionOptions.find((opt) => opt.value === action.position)
        const actionLabel = moveCopyOption ? moveCopyOption.label : 'move'
        const positionLabel = positionOption ? positionOption.label : 'to the top of list'
        return `${actionLabel} the card ${positionLabel} ${getListName(action.listId as string)}`
      }
      case 'MOVE_CARD': {
        const moveActionOption = moveCardActionOptions.find((opt) => opt.value === action.action)
        const actionLabel = moveActionOption ? moveActionOption.label : 'to the top of the list'
        return `move the card to ${actionLabel}`
      }
      case 'MARK_CARD_STATUS': {
        const statusOption = statusOptions.find((opt) => opt.value === action.status)
        const statusLabel = statusOption ? statusOption.label : 'complete'
        return `mark the card as ${statusLabel}`
      }
      case 'ADD_MEMBER': {
        const assignmentOption = memberAssignmentOptions.find((opt) => opt.value === action.assignment)
        const assignmentLabel = assignmentOption ? assignmentOption.label : 'at random'
        return `add member ${assignmentLabel} to the card`
      }
      case 'CREATE_CARD': {
        const typeOption = cardCreationTypeOptions.find((opt) => opt.value === action.type)
        const typeLabel = typeOption ? typeOption.label : 'a new'
        return `create ${typeLabel} card with title "${action.title}" in list ${getListName(action.listId as string)}`
      }
      case 'MOVE_COPY_ALL_CARDS': {
        const moveCopyOption = moveCopyOptions.find((opt) => opt.value === action.action)
        const actionLabel = moveCopyOption ? moveCopyOption.label : 'move'
        return `${actionLabel} all the cards in list ${getListName(action.fromListId as string)} to list ${getListName(action.toListId as string)}`
      }
      case 'MOVE_LIST': {
        const positionOption = listPositionOptions.find((opt) => opt.value === action.position)
        const positionLabel = positionOption ? positionOption.label : 'untitled action'
        return `move the list ${positionLabel} in the board`
      }
      default:
        return ''
    }
  })

  // Combine trigger and actions
  const actionsString = actionTexts
    .filter((text) => text.length > 0)
    .map((text, index) => {
      if (index === 0) return text
      if (index === actionTexts.length - 1) return `and ${text}`
      return text
    })
    .join(', ')

  return `${triggerText}, ${actionsString}`
}

export const createTempButler = ({ category, details }: { category: ButlerCategory; details: ButlerData }): Butler => {
  const now = new Date()

  return {
    id: getTempId('butler'),
    boardId: getTempId('board'),
    handlerKey: details.trigger.handlerKey,
    category,
    creatorId: getTempId('user'),
    isEnabled: true,
    details,
    isDeleted: false,
    createdAt: now,
    updatedAt: now
  }
}

export const updateBoardButlersQuery = (
  queryClient: QueryClient,
  boardSlug: string,
  category: ButlerCategory,
  updater: (prev: Butler[]) => Butler[]
) => {
  queryClient.setQueryData(['board', 'butlers', category, boardSlug], (prev: Butler[]) => {
    if (!prev) return prev
    return updater(prev)
  })
}

// Queries
export const createButlerQueries = ({
  queryClient,
  boardSlug,
  category,
  details
}: {
  queryClient: QueryClient
  boardSlug: string
  category: ButlerCategory
  details: ButlerData
}) => {
  updateBoardButlersQuery(queryClient, boardSlug, category, (prev) => {
    return [...prev, createTempButler({ category, details })]
  })
}

// Invalidates
export const invalidateBoardButlersQueries = (
  queryClient: QueryClient,
  boardSlug: string,
  category: ButlerCategory
) => {
  queryClient.invalidateQueries({ queryKey: ['board', 'butlers', category, boardSlug] })
}
