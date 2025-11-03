import { UIActivity } from '@/prisma/queries/activity'
import { UIComment } from '@/prisma/queries/comment'
import { UIUser } from '@/prisma/queries/user'

export enum TimelineItemType {
  Activity = 'activity',
  Comment = 'comment'
}

export type TimelineItem =
  | (UIActivity & { user: UIUser } & { __type: TimelineItemType.Activity })
  | (UIComment & { user: UIUser } & { __type: TimelineItemType.Comment })

export type CardTimeline = {
  activities: (UIActivity & { user: UIUser } & { __type: TimelineItemType.Activity })[]
  comments: (UIComment & { user: UIUser } & { __type: TimelineItemType.Comment })[]
  sortedList: TimelineItem[]
}

export interface FileInfo {
  url: string
  path: string
  name: string
  size: number
  type: string
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

export interface AssigneeDetails {
  [key: string]: string
  actorId: string
  actorName: string
  targetId: string
  targetName: string
}
