import { Prisma } from '@prisma/client'
import { UICardLabel } from './card'

// Select
export const labelSelect = {
  id: true,
  color: true,
  title: true
} satisfies Prisma.LabelSelect

// Where conditions
export const labelActiveWhere: Prisma.LabelWhereInput = {
  isDeleted: false
}

// OrderBy
export const labelOrderBy = {
  updatedAt: 'desc'
} satisfies Prisma.LabelOrderByWithRelationInput

// Label
export type UILabel = Prisma.LabelGetPayload<{
  select: typeof labelSelect
}>

export type UILabelDetail = UICardLabel & {
  label: UILabel
}
