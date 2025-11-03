import { TimelineItemType } from '@/shared/types'
import { Prisma } from '@prisma/client'

// Select
export const activitySelect = {
  id: true,
  action: true,
  details: true,
  model: true,
  createdAt: true
} satisfies Prisma.ActivitySelect

// OrderBy
export const activityOrderBy = {
  createdAt: 'desc'
} satisfies Prisma.ActivityOrderByWithRelationInput

// Types
export type UIActivity = Prisma.ActivityGetPayload<{ select: typeof activitySelect }> & {
  __type: TimelineItemType
}
