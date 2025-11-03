'use client'

import { Combobox } from '@/components/combobox'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { UIList } from '@/prisma/queries/list'
import { cn } from '@/shared/utils'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { z, ZodError } from 'zod'
import { AutomationTemplate, Part, PartId } from '../types'
import { getInitialState } from '../utils'

export default function TriggerFormCard<T extends z.ZodTypeAny>({
  rule,
  lists = [],
  onSelect,
  schema
}: {
  rule: AutomationTemplate
  lists?: UIList[]
  onSelect: (data: z.infer<T>) => void
  schema: T
}) {
  const [fieldValues, setFieldValues] = useState(() => getInitialState(rule.parts))
  const [fieldErrors, setFieldErrors] = useState<Set<PartId>>(new Set())

  const handleValueChange = (part: Part, value: string | number | undefined) => {
    setFieldValues((prev) => ({
      ...prev,
      [part.id]: {
        type: part.type,
        value
      }
    }))

    // Clear error for this field when user changes value
    if (fieldErrors.has(part.id)) {
      setFieldErrors((prev) => {
        const newErrors = new Set(prev)
        newErrors.delete(part.id)
        return newErrors
      })
    }
  }

  const listOptions = lists.map((list) => ({
    value: list.id,
    label: list.name
  }))

  const handleSelect = () => {
    try {
      const validatedData = schema.parse({
        templateId: rule.id,
        handlerKey: rule.handlerKey,
        category: rule.category,
        fields: fieldValues
      })

      onSelect(validatedData)
      setFieldErrors(new Set())
    } catch (error) {
      if (error instanceof ZodError) {
        const errorFields = new Set<PartId>()

        error.issues.forEach((issue) => {
          // Path will have this format ['fields', 't-card-added-to-list-listId']
          if (issue.path.length >= 2 && issue.path[0] === 'fields') {
            const fieldId = issue.path[1] as PartId
            errorFields.add(fieldId)
          }
        })

        setFieldErrors(errorFields)
      } else {
        console.log(error)
      }
    }
  }

  return (
    <Card key={rule.id} className='rounded-md bg-muted/10 p-3 flex-row items-center gap-2'>
      <div className='flex items-center gap-2 flex-1'>
        {rule.parts.map((part) => {
          const hasError = fieldErrors.has(part.id)

          switch (part.type) {
            case 'text-display':
              return <p key={part.id}>{part.defaultValue}</p>
            case 'list-combobox':
              return (
                <Combobox
                  key={part.id}
                  options={listOptions}
                  placeholder={part.placeholder}
                  value={String(fieldValues[part.id]?.value ?? '')}
                  onChange={(value) => handleValueChange(part, value)}
                  error={hasError}
                />
              )
            case 'select':
              return (
                <Select
                  key={part.id}
                  value={String(fieldValues[part.id]?.value ?? '')}
                  onValueChange={(value) => handleValueChange(part, value)}
                >
                  <SelectTrigger className={cn(hasError && 'ring-destructive ring-2 ring-offset-1')}>
                    <SelectValue placeholder={part.placeholder} />
                  </SelectTrigger>
                  <SelectContent>
                    {part.options.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )
            case 'number-input':
              return (
                <Input
                  key={part.id}
                  type='number'
                  placeholder={part.placeholder}
                  className={cn('w-fit', hasError && 'ring-destructive ring-2 ring-offset-1')}
                  value={String(fieldValues[part.id]?.value ?? '')}
                  onChange={(e) => handleValueChange(part, Number(e.target.value))}
                />
              )
            default:
              return null
          }
        })}
      </div>

      <Button size='icon-lg' className='rounded-full' onClick={handleSelect}>
        <Plus className='size-6 text-white stroke-2' />
      </Button>
    </Card>
  )
}
