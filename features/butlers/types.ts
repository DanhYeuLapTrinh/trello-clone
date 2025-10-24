import { ButlerCategory } from '@prisma/client'
import { ActionSchema, TriggerSchema } from './validations/server'

export interface Option {
  label: string
  value: string
}

export type FieldValue = { type: string; value: string | number }

export type Part =
  // Used for displaying text
  | { type: 'text-display'; id: string; defaultValue?: string }
  // Used for selecting an option from a list
  | { type: 'select'; id: string; placeholder?: string; defaultValue?: string; options: Option[] }
  // Used for entering a text
  | { type: 'text-input'; id: string; placeholder?: string; defaultValue?: string }
  // Used for entering a number
  | { type: 'number-input'; id: string; placeholder?: string; defaultValue?: number }
  // Used for searching and selecting a list
  | { type: 'list-combobox'; id: string; placeholder?: string; defaultValue?: string }

export interface AutomationTemplate {
  id: string
  category: ButlerCategory
  handlerKey: string
  parts: readonly Part[]
}

export interface BackendRuleData {
  [key: string]: TriggerSchema | ActionSchema[]
  trigger: TriggerSchema
  actions: ActionSchema[]
}

// Re-export them here for convenience since they are types but the original are from constants.ts
export type { HandlerKey, PartId, TemplateId } from './constants'
