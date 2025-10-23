import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { UIList } from '@/types/ui'
import { ArrowUp, Trash } from 'lucide-react'
import { actionTemplates } from '../constants'
import { getFieldFromAction } from '../utils'
import { AutomationActionSchema } from '../validations'

const renderActionDisplay = (action: AutomationActionSchema, lists: UIList[]) => {
  const template = actionTemplates.find((t) => t.id === action.templateId)
  if (!template) return null

  return template.parts.map((part) => {
    const field = getFieldFromAction(action, part.id)

    if (!field) return null

    switch (part.type) {
      case 'text-display':
        return <p key={part.id}>{field.value}</p>
      case 'select':
        const label = part.options.find((opt) => opt.value === field.value)?.label
        return <p key={part.id}>{label}</p>
      case 'list-combobox':
        const listName = lists.find((l) => l.id === field.value)?.name
        return (
          <p key={part.id} className='font-semibold text-primary'>
            &quot;{listName}&quot;
          </p>
        )
      case 'number-input':
        return <p key={part.id}>{field.value}</p>
      case 'text-input':
        return <p key={part.id}>&quot;{field.value}&quot;</p>
    }
  })
}

export default function ActionCard({
  action,
  lists,
  position,
  isDisabled,
  onSwap,
  onDelete
}: {
  action: AutomationActionSchema
  lists: UIList[]
  position: number
  isDisabled: boolean
  onSwap: () => void
  onDelete: () => void
}) {
  return (
    <div className='flex items-center gap-3'>
      <Card className='rounded-md bg-muted/10 p-3 flex-row items-center gap-2 font-code w-9/12'>
        {renderActionDisplay(action, lists)}
      </Card>
      <Button variant='secondary' size='icon-lg' onClick={onDelete} disabled={isDisabled}>
        <Trash className='stroke-2' />
      </Button>
      {position > 0 && (
        <Button variant='secondary' size='icon-lg' onClick={onSwap}>
          <ArrowUp className='size-4.5' />
        </Button>
      )}
    </div>
  )
}
