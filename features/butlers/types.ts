import { ButlerCategory } from '@prisma/client'
import { ActionSchema, TriggerSchema } from './validations/server'

export interface Option<T> {
  label: string
  value: T
}

export type FieldValue = { type: string; value: string | number }

export type Part =
  // Used for displaying text
  | { type: 'text-display'; id: string; defaultValue?: string }
  // Used for selecting an option from a list
  | { type: 'select'; id: string; placeholder?: string; defaultValue?: string; options: Option<string>[] }
  // Used for entering a text
  | { type: 'text-input'; id: string; placeholder?: string; defaultValue?: string }
  // Used for entering a number
  | { type: 'number-input'; id: string; placeholder?: string; defaultValue?: number }
  // Used for searching and selecting a list
  | { type: 'list-combobox'; id: string; placeholder?: string; defaultValue?: string }

export enum ByOption {
  ME = 'me',
  ANYONE = 'anyone',
  ANYONE_EXCEPT_ME = 'anyone-except-me'
}

export enum DayOption {
  MON = 'mon',
  TUE = 'tue',
  WED = 'wed',
  THU = 'thu',
  FRI = 'fri',
  SAT = 'sat',
  SUN = 'sun'
}

export enum IntervalOption {
  DAY = 'day',
  WEEKDAY = 'weekday'
}

export enum StatusOption {
  COMPLETE = 'complete',
  INCOMPLETE = 'incomplete'
}

export enum MoveCopyOption {
  MOVE = 'move',
  COPY = 'copy'
}

export enum PositionOption {
  TOP = 'top',
  BOTTOM = 'bottom'
}

export enum ListPositionOption {
  FIRST = 'first',
  LAST = 'last'
}

export enum MoveCardActionOption {
  TOP_CURRENT = 'top-current',
  BOTTOM_CURRENT = 'bottom-current',
  NEXT = 'next',
  PREVIOUS = 'previous'
}

export enum MemberAssignmentOption {
  RANDOM = 'random',
  TURN = 'turn'
}

export enum CardCreationTypeOption {
  NEW = 'new',
  UNIQUE = 'unique'
}

export interface AutomationTemplate {
  id: string
  category: ButlerCategory
  handlerKey: string
  parts: readonly Part[]
}

export interface ButlerData {
  [key: string]: TriggerSchema | ActionSchema[]
  trigger: TriggerSchema
  actions: ActionSchema[]
}

// Re-export them here for convenience since they are types but the original are from constants.ts
export type { PartId, TemplateId } from './constants'
