import { Label, List } from '@prisma/client'
import { CardPreview } from './common'

export interface CardLabelColor {
  baseColor: string
  shades: { value: string; isDefaultSelect: boolean; isDefaultDisplay: boolean; textColor: string }[]
}

export interface LabelAction {
  action: 'create' | 'update' | 'delete'
  label?: Label
}

export type UpdateCardFn = (card: CardPreview) => CardPreview

// DB
export type UIList = Omit<List, 'isDeleted'>
