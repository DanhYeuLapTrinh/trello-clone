import { TimelineItemType } from '@/shared/types'
import { Prisma } from '@prisma/client'

// Select
export const commentSelect = {
  id: true,
  content: true,
  createdAt: true
} satisfies Prisma.CommentSelect

// Where conditions
export const commentActiveWhere: Prisma.CommentWhereInput = {
  isDeleted: false
}

// OrderBy
export const commentOrderBy = {
  createdAt: 'desc'
} satisfies Prisma.CommentOrderByWithRelationInput

// Types
export type UIComment = Prisma.CommentGetPayload<{ select: typeof commentSelect }> & {
  __type: TimelineItemType
}
