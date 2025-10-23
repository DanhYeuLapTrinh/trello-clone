export interface Option {
  label: string
  value: string
}

export type AutomationCategory = 'rule' | 'scheduled'

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
  category: AutomationCategory
  handlerKey: string
  parts: readonly Part[]
}

// Re-export them here for convenience since they are types but the original are from constants.ts
export type { ActionHandlerKey, ActionTemplateId, PartId, TriggerHandlerKey, TriggerTemplateId } from './constants'

// Backend-ready format types
export interface BackendTrigger {
  handlerKey: string
  category: AutomationCategory
  [key: string]: string | number | AutomationCategory
}

export interface BackendAction {
  handlerKey: string
  category: AutomationCategory
  [key: string]: string | number | AutomationCategory
}

export interface BackendRuleData {
  trigger: BackendTrigger
  actions: BackendAction[]
}
