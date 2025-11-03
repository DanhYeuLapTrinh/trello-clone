import { Prisma } from '@prisma/client'
import { cardPreviewSelect } from './card'

// Queries
export const listSelect = {
  id: true,
  name: true,
  position: true
} satisfies Prisma.ListSelect

export const listWithCardsSelect = (id: string) =>
  ({
    ...listSelect,
    cards: {
      select: cardPreviewSelect(id),
      where: {
        isDeleted: false
      },
      orderBy: {
        position: 'asc'
      }
    }
  }) satisfies Prisma.ListSelect

// Types
export type ListWithCards = Prisma.ListGetPayload<{
  select: ReturnType<typeof listWithCardsSelect>
}>

export type UIList = Prisma.ListGetPayload<{
  select: typeof listSelect
}>
