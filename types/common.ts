import { Activity, Attachment, Card, CardLabel, Comment, Label, List, Subtask, User } from '@prisma/client'

export interface AppResponse<T> {
  data: T
  message: string
  status: 'success' | 'error'
}

export interface FileInfo {
  url: string
  path: string
  name: string
  size: number
  type: string
}

export type LabelDetail = CardLabel & { label: Label }

export type SubtaskDetail = Subtask & { children: Subtask[] }

export type CardPreview = Card & {
  cardLabels: LabelDetail[]
  subtasks: SubtaskDetail[]
  assignees: { user: User }[]
  watchers: { user: User }[]
  _count: {
    attachments: number
    comments: number
  }
}

export type CardDetail = Card & {
  list: List
  cardLabels: LabelDetail[]
  subtasks: SubtaskDetail[]
  assignees: { user: User }[]
  watchers: { user: User }[]
  attachments: Attachment[]
  comments: Comment[]
}

export type ListWithCards = List & {
  cards: CardPreview[]
}

export enum TimelineItemType {
  Activity = 'activity',
  Comment = 'comment'
}

export type TimelineItem =
  | (Activity & { user: User } & { __type: TimelineItemType.Activity })
  | (Comment & { user: User } & { __type: TimelineItemType.Comment })

export interface CardTimeline {
  activities: (Activity & { user: User })[]
  comments: (Comment & { user: User })[]
  sortedList: TimelineItem[]
}

// Activity details
export interface CreateDetails {
  nameSnapshot: string
  initialValues?: Record<string, unknown>
}

export interface UpdateDetails {
  field: string
  oldValue: string
  newValue: string
}

export interface MoveDetails {
  fromListId: string
  fromListName: string
  toListId: string
  toListName: string
  position?: number
}

export interface AssignMemberDetails {
  userId: string
}

export interface UnassignMemberDetails {
  userId: string
}
