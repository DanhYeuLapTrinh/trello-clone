import { Attachment, Card, CardLabel, Comment, List, User } from '@prisma/client'

export interface AppResponse<T> {
  data: T
  message: string
  status: 'success' | 'error'
}

export type CardPreview = Card & {
  cardLabels: CardLabel[]
  subtasks: Card[]
  assignees: { user: User }[]
  _count: {
    attachments: number
    comments: number
  }
}

export type CardDetail = Card & {
  list: List
  cardLabels: CardLabel[]
  subtasks: Card[]
  assignees: { user: User }[]
  attachments: Attachment[]
  comments: Comment[]
}

export type ListWithCards = List & {
  cards: CardPreview[]
}
