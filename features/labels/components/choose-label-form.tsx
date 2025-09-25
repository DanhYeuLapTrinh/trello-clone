import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { cn, getColorTextClass } from '@/lib/utils'
import { LabelDetail } from '@/types/common'
import { LabelAction } from '@/types/ui'
import { Label } from '@prisma/client'
import { useQueryClient } from '@tanstack/react-query'
import { Pencil } from 'lucide-react'
import { SubmitHandler } from 'react-hook-form'
import { useAssignLabel } from '../hooks/use-assign-label'
import { useCreateLabel } from '../hooks/use-create-label'
import { useUnassignLabel } from '../hooks/use-unassign-label'
import {
  addLabelToCard,
  createLabelWithAssignment,
  createTempLabel,
  getDisplayLabels,
  removeLabelFromCard
} from '../utils'
import { AssignLabelSchema, UnassignLabelSchema } from '../validations'

interface ChooseLabelFormProps {
  boardSlug: string
  cardSlug: string
  boardLabels: Label[] | undefined
  sortedCardLabelColors: typeof import('@/lib/constants').sortedCardLabelColors
  cardLabels: LabelDetail[]
  setLabelAction: (labelAction: LabelAction | null) => void
}

export default function ChooseLabelForm({
  boardSlug,
  cardSlug,
  boardLabels,
  sortedCardLabelColors,
  cardLabels,
  setLabelAction
}: ChooseLabelFormProps) {
  const queryClient = useQueryClient()
  const { createLabelAction } = useCreateLabel(boardSlug, cardSlug)
  const { methods: assignLabelMethods, assignLabelAction } = useAssignLabel(boardSlug, cardSlug)
  const { methods: unassignLabelMethods, unassignLabelAction } = useUnassignLabel(boardSlug, cardSlug)

  const onSubmitAssign: SubmitHandler<AssignLabelSchema> = (data) => {
    assignLabelAction.execute(data)
  }

  const onSubmitUnassign: SubmitHandler<UnassignLabelSchema> = (data) => {
    unassignLabelAction.execute(data)
  }

  const handleLabelToggle = (label: Label, isCurrentlyAssigned: boolean) => {
    if (isCurrentlyAssigned) {
      // Remove label from card
      removeLabelFromCard(queryClient, boardSlug, cardSlug, label.id)
      unassignLabelMethods.setValue('labelId', label.id)
      unassignLabelMethods.handleSubmit(onSubmitUnassign)()
    } else {
      // Add label to card
      addLabelToCard(queryClient, boardSlug, cardSlug, label)
      assignLabelMethods.setValue('labelId', label.id)
      assignLabelMethods.handleSubmit(onSubmitAssign)()
    }
  }

  const handleLabelCreate = (color: string, isCurrentlyAssigned: boolean) => {
    if (!isCurrentlyAssigned) {
      createLabelWithAssignment(queryClient, boardSlug, cardSlug, '', color)

      createLabelAction.execute({
        boardSlug,
        cardSlug,
        color
      })
    }
  }

  return (
    <div className='p-2 space-y-2'>
      <Input placeholder='Tìm nhãn...' />
      <p className='font-medium text-xs text-muted-foreground py-1'>Nhãn</p>

      <div className='space-y-0'>
        {getDisplayLabels(boardLabels, sortedCardLabelColors).map((item) => {
          if ('type' in item && item.type === 'color-option') {
            // Render color option (from FE)
            const { shade } = item

            if (!shade) return null

            return (
              <div key={`color-${shade.value}`} className='flex items-center gap-1 pl-1'>
                <Checkbox
                  className='mr-2'
                  checked={cardLabels.some((cardLabel) => cardLabel.label.color === shade.value)}
                  onCheckedChange={() => {
                    const isCurrentlyAssigned = cardLabels.some((cardLabel) => cardLabel.label.color === shade.value)
                    handleLabelCreate(shade.value, isCurrentlyAssigned)
                  }}
                />
                <div className={cn(shade.value, 'w-full h-8 rounded-sm')} />
                <Button
                  variant='ghost'
                  size='icon'
                  onClick={() => setLabelAction({ action: 'update', label: createTempLabel('', shade.value) })}
                >
                  <Pencil className='size-3.5' />
                </Button>
              </div>
            )
          } else if ('type' in item && item.type === 'divider') {
            return <Separator key={item.type} className='my-2' />
          } else {
            // Render existing board label (from DB)
            const label = item as Label
            return (
              <div key={label.id} className='flex items-center gap-1 pl-1'>
                <Checkbox
                  className='mr-2'
                  checked={cardLabels.some((cardLabel) => {
                    if (cardLabel.label.title && cardLabel.label.color) {
                      return cardLabel.label.title === label.title && cardLabel.label.color === label.color
                    }
                    if (cardLabel.label.title) {
                      return cardLabel.label.title === label.title
                    }
                    if (cardLabel.label.color) {
                      return cardLabel.label.color === label.color
                    }
                  })}
                  onCheckedChange={() => {
                    const isCurrentlyAssigned = cardLabels.some((cardLabel) => cardLabel.labelId === label.id)
                    handleLabelToggle(label, isCurrentlyAssigned)
                  }}
                />
                <div
                  className={cn(
                    label.color || 'bg-muted-foreground/5',
                    'flex-1 min-w-0 h-8 rounded-sm flex items-center px-2'
                  )}
                >
                  {label.title ? (
                    <p className={cn('text-sm font-semibold truncate', getColorTextClass(label.color ?? ''))}>
                      {label.title}
                    </p>
                  ) : null}
                </div>
                <Button variant='ghost' size='icon' onClick={() => setLabelAction({ action: 'update', label })}>
                  <Pencil className='size-3.5' />
                </Button>
              </div>
            )
          }
        })}
      </div>

      <Button
        variant='secondary'
        className='w-full mt-2'
        onClick={() => setLabelAction({ action: 'create' })}
        disabled={createLabelAction.isPending}
      >
        Tạo nhãn mới
      </Button>
    </div>
  )
}
