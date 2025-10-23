import {
  byOptions,
  cardCreationTypeOptions,
  dayOptions,
  memberAssignmentOptions,
  moveCardActionOptions,
  moveCopyOptions,
  positionOptions
} from './constants'
import { BackendRuleData, FieldValue, Part, PartId } from './types'
import { AutomationActionSchema, AutomationTriggerSchema } from './validations'

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
 *
 * @example
 * // Rule automation example:
 * // Input: When a card is created by me, move it to top of "To Do" list
 * {
 *   trigger: {
 *     handlerKey: 'WHEN_CARD_CREATED',
 *     category: 'rule',
 *     by: 'me'
 *   },
 *   actions: [
 *     {
 *       handlerKey: 'MOVE_COPY_CARD_TO_LIST',
 *       category: 'rule',
 *       action: 'move',
 *       position: 'top',
 *       listId: '123e4567-e89b-12d3-a456-426614174000'
 *     }
 *   ]
 * }
 *
 * @example
 * // Scheduled automation example:
 * // Input: Every weekday, create a new card "Daily Standup" in "Meetings" list
 * {
 *   trigger: {
 *     handlerKey: 'WHEN_SCHEDULED_DAILY',
 *     category: 'scheduled',
 *     interval: 'weekday'
 *   },
 *   actions: [
 *     {
 *       handlerKey: 'CREATE_CARD',
 *       category: 'scheduled',
 *       type: 'new',
 *       title: 'Daily Standup',
 *       listId: '456e7890-e89b-12d3-a456-426614174000'
 *     }
 *   ]
 * }
 *
 * @example
 * // Complex rule with multiple actions:
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
}): BackendRuleData => {
  const extractFieldValues = (fields: Record<string, FieldValue>): Record<string, string | number> => {
    return Object.fromEntries(
      Object.entries(fields)
        // Remove text-display fields since they are only for UI
        .filter(([_fieldId, fieldData]) => fieldData.type !== 'text-display')
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
    },
    actions: data.actions.map((action) => ({
      handlerKey: action.handlerKey,
      category: action.category,
      ...extractFieldValues(action.fields as Record<string, FieldValue>)
    }))
  }
}
