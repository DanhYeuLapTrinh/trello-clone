export interface Option {
  label: string
  value: string
}

export type AutomationCategory = 'rule' | 'scheduled'

export type Part =
  // Used for displaying text
  | { type: 'text-display'; value: string }
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
  parts: Part[]
}
