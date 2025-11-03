import { Prisma } from '@prisma/client'
import { UIUser } from './user'

// Select
export const butlerSelect = {
  id: true,
  handlerKey: true,
  details: true,
  isEnabled: true,
  category: true,
  updatedAt: true
} satisfies Prisma.ButlerSelect

// Where conditions
export const butlerActiveWhere: Prisma.ButlerWhereInput = {
  isDeleted: false
}

// OrderBy
export const butlerOrderBy = {
  createdAt: 'asc'
} satisfies Prisma.ButlerOrderByWithRelationInput

// Types
export type UIButler = Prisma.ButlerGetPayload<{
  select: typeof butlerSelect
}>

export type BoardButler = UIButler & {
  creator: UIUser
}
