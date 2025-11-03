import { UILabel } from '@/prisma/queries/label'

export interface LabelAction {
  action: 'create' | 'update' | 'delete'
  label?: UILabel
}
