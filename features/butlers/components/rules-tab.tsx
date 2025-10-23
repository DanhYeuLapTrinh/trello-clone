'use client'

import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { getBoardLists } from '@/features/boards/actions'
import { cn } from '@/lib/utils'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { Bot, ChevronRight, Plus } from 'lucide-react'
import { Fragment, useState } from 'react'
import { SubmitHandler, useFieldArray, useForm } from 'react-hook-form'
import { ruleActionTemplates, ruleTriggerTemplates } from '../constants'
import { transformRuleForBackend } from '../utils'
import { AutomationActionSchema, AutomationTriggerSchema, createRuleSchema, CreateRuleSchema } from '../validations'
import ActionCard from './action-card'
import ActionFormCard from './action-form-card'
import TriggerCard from './trigger-card'
import TriggerFormCard from './trigger-form-card'

const steps = [
  {
    step: 1,
    label: 'Select trigger'
  },
  {
    step: 2,
    label: 'Select action'
  },
  {
    step: 3,
    label: 'Review and save'
  }
]

export default function RulesTab({ boardSlug }: { boardSlug: string }) {
  const [step, setStep] = useState(0)
  const [addMoreAction, setAddMoreAction] = useState(false)

  const { data: lists = [] } = useQuery({
    queryKey: ['board', 'lists', boardSlug],
    queryFn: () => getBoardLists(boardSlug)
  })

  const methods = useForm<CreateRuleSchema>({
    defaultValues: {
      actions: []
    },
    resolver: zodResolver(createRuleSchema)
  })
  const { setValue, watch, reset, control, handleSubmit } = methods
  const { trigger } = watch()

  const { fields, append, remove, swap } = useFieldArray({
    control,
    name: 'actions'
  })

  const handleSelectTrigger = (data: AutomationTriggerSchema) => {
    setValue('trigger', data)
  }

  const handleDeleteTrigger = () => {
    reset()
    setStep(1)
  }

  const handleAddAction = (data: AutomationActionSchema) => {
    append(data)
    setAddMoreAction(false)
  }

  const handleDeleteAction = (index: number) => {
    remove(index)
  }

  const handleSwapAction = (from: number, to: number) => {
    swap(from, to)
  }

  const handleCancel = () => {
    methods.reset()
    setStep(0)
  }

  const onSubmit: SubmitHandler<CreateRuleSchema> = (data) => {
    console.log(transformRuleForBackend(data))
  }

  const render = () => {
    switch (step) {
      case 2:
        return (
          <div className='flex flex-col gap-4 mt-2'>
            <p className='text-xl font-semibold'>Trigger</p>
            {trigger && <TriggerCard trigger={trigger} lists={lists} onDelete={handleDeleteTrigger} />}

            {fields.length > 0 && (
              <div className='flex flex-col gap-4 mt-4'>
                <p className='text-xl font-semibold'>Action</p>
                <div className='flex flex-col gap-3'>
                  {fields.map((action, index) => (
                    <ActionCard
                      key={action.id}
                      action={action}
                      lists={lists}
                      onDelete={() => handleDeleteAction(index)}
                      onSwap={() => handleSwapAction(index, index - 1)}
                      position={index}
                      isDisabled={fields.length === 1}
                    />
                  ))}

                  {!addMoreAction && (
                    <Button className='self-center' variant='secondary' onClick={() => setAddMoreAction(true)}>
                      <Plus />
                      Add another action
                    </Button>
                  )}
                </div>
              </div>
            )}

            {(fields.length === 0 || addMoreAction) && (
              <div className='flex flex-col gap-4 mt-4'>
                <p className='text-xl font-semibold'>Select Action</p>
                <div className='space-y-3'>
                  {ruleActionTemplates.map((action) => (
                    <ActionFormCard key={action.id} action={action} lists={lists} onAdd={handleAddAction} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      default:
        return (
          <div className='space-y-4'>
            <p className='text-xl font-semibold'>Select Trigger</p>

            {ruleTriggerTemplates.map((rule) => (
              <TriggerFormCard
                key={rule.id}
                rule={rule}
                lists={lists}
                setStep={setStep}
                onSelect={handleSelectTrigger}
              />
            ))}
          </div>
        )
    }
  }

  if (step > 0) {
    return (
      <div className='flex flex-col gap-4'>
        {/* Header */}
        <div className='flex items-center gap-2'>
          <p className='text-2xl font-semibold flex-1'>Create a Rule</p>
          <div className='flex items-center gap-2'>
            <Button disabled={!trigger || !fields.length} onClick={handleSubmit(onSubmit)}>
              Save
            </Button>
            <Button variant='secondary' onClick={handleCancel}>
              Cancel
            </Button>
          </div>
        </div>

        <Separator />
        <div className='px-12 pt-14 pb-4 flex items-center justify-center gap-6'>
          {steps.map((s, idx) => (
            <Fragment key={s.step}>
              <div className='flex items-center gap-3'>
                <div
                  className={cn(
                    'size-7 rounded-full flex items-center justify-center bg-muted',
                    s.step === step && 'bg-muted-foreground text-white'
                  )}
                >
                  <p className='text-sm'>{s.step}</p>
                </div>
                <p className={cn('text-sm', s.step === step && 'font-semibold')}>{s.label}</p>
              </div>
              {(idx === 0 || idx < steps.length - 1) && (
                <ChevronRight className='size-8 shrink-0 text-muted-foreground stroke-3' />
              )}
            </Fragment>
          ))}
        </div>
        <Separator />

        {/* Content */}
        {render()}
      </div>
    )
  }

  return (
    <>
      <p className='text-2xl font-semibold'>Rules</p>
      <Separator className='mt-4 mb-2' />
      <div className='grid grid-cols-12 p-4 gap-6'>
        <div className='col-span-6 space-y-4'>
          <p className='text-2xl font-semibold'>
            Rules are simple: when one thing happens, another thing happens automatically
          </p>

          <p>Examples:</p>

          <div className='p-4 space-y-4'>
            <div className='flex items-start gap-3'>
              <Bot className='size-6 text-primary shrink-0' />
              <p>
                When a <span className='font-bold'>card is created in list</span> &quot;To Do&quot; by me,{' '}
                <span className='font-bold'>add the &quot;Steps&quot; checklist.</span>
              </p>
            </div>

            <div className='flex items-start gap-3'>
              <Bot className='size-6 text-primary shrink-0' />
              <p>
                When a <span className='font-bold'>card is moved to list</span> &quot;Done&quot; by anyone,{' '}
                <span className='font-bold'>mark the due date as complete and remove all members from the card.</span>
              </p>
            </div>

            <div className='flex items-start gap-3'>
              <Bot className='size-6 text-primary shrink-0' />
              <p>
                <span className='font-bold'>When I am added to a card, set the due date</span> in 5 working days and{' '}
                <span className='font-bold'>post a comment</span> saying &quot;I got this!&quot;
              </p>
            </div>

            <Button className='mt-2' onClick={() => setStep(1)}>
              <p className='font-bold'>Create automation</p>
            </Button>
          </div>
        </div>
        <div className='col-span-6'>
          <iframe
            className='w-full h-60 rounded-md'
            src='https://www.youtube.com/embed/WSMfGoXrL9I?si=-CDgBUXA-fYtMzkQ'
            title='YouTube video player'
            allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'
            referrerPolicy='strict-origin-when-cross-origin'
            allowFullScreen
          ></iframe>
          <p className='text-center text-foreground/90 text-sm mt-4'>Watch a 65-second overview of rules</p>
        </div>
      </div>
    </>
  )
}
