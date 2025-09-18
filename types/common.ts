import { Card, List } from '@prisma/client'

export interface AppResponse<T> {
  data: T
  message: string
  status: 'success' | 'error'
}

export type ListWithCards = List & {
  cards: Card[]
}
