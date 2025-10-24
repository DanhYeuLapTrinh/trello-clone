import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { UIList } from '@/types/ui'
import { Trash2 } from 'lucide-react'
import { ruleTriggerTemplates } from '../constants'
import { getFieldFromTrigger } from '../utils'
import { AutomationTriggerSchema } from '../validations/client'

const renderTriggerDisplay = (trigger: AutomationTriggerSchema, lists: UIList[]) => {
  const template = ruleTriggerTemplates.find((t) => t.id === trigger.templateId)
  if (!template) return null

  return template.parts.map((part) => {
    const field = getFieldFromTrigger(trigger, part.id)

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
        return <p key={part.id}>{field.value}</p>
    }
  })
}

export default function TriggerCard({
  trigger,
  lists,
  onDelete
}: {
  trigger: AutomationTriggerSchema
  lists: UIList[]
  onDelete: () => void
}) {
  return (
    <div className='flex items-center gap-3'>
      <Card className='rounded-md bg-muted/10 p-3 flex-row items-center gap-2 font-code w-9/12'>
        {renderTriggerDisplay(trigger, lists)}
      </Card>
      <Button variant='secondary' size='icon-lg' onClick={onDelete}>
        <Trash2 className='stroke-2' />
      </Button>
    </div>
  )
}
