'use client'

import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { getBoardLists } from '@/features/boards/queries'
import { zodResolver } from '@hookform/resolvers/zod'
import { ButlerCategory } from '@prisma/client'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Bot, Plus } from 'lucide-react'
import { useState } from 'react'
import { SubmitHandler, useFieldArray, useForm } from 'react-hook-form'
import { scheduledActionTemplates, scheduledTriggerTemplates } from '../constants'
import { useCreateButler } from '../hooks/use-create-butler'
import { getBoardButlers } from '../queries'
import { createButlerQueries, transformRuleForBackend } from '../utils'
import {
  automationScheduledActionSchema,
  AutomationScheduledActionSchema,
  AutomationScheduledTriggerSchema,
  automationScheduledTriggerSchema,
  createScheduledSchema,
  CreateScheduledSchema
} from '../validations/client'
import ActionCard from './action-card'
import ActionFormCard from './action-form-card'
import ButlerCard from './butler-card'
import TriggerCard from './trigger-card'
import TriggerFormCard from './trigger-form-card'

export default function ScheduledTab({ boardSlug }: { boardSlug: string }) {
  const queryClient = useQueryClient()

  const [isCreating, setIsCreating] = useState(false)
  const [addMoreAction, setAddMoreAction] = useState(false)

  const { data: lists = [] } = useQuery({
    queryKey: ['board', 'lists', boardSlug],
    queryFn: () => getBoardLists(boardSlug)
  })

  const { data: schedules = [] } = useQuery({
    queryKey: ['board', 'butlers', ButlerCategory.SCHEDULED, boardSlug],
    queryFn: () => getBoardButlers(boardSlug, ButlerCategory.SCHEDULED)
  })

  const methods = useForm<CreateScheduledSchema>({
    defaultValues: {
      actions: []
    },
    resolver: zodResolver(createScheduledSchema)
  })
  const { setValue, watch, reset, control, handleSubmit } = methods
  const { trigger } = watch()

  const { fields, append, remove, swap } = useFieldArray({
    control,
    name: 'actions'
  })

  const handleSelectTrigger = (data: AutomationScheduledTriggerSchema) => {
    setValue('trigger', data)
  }

  const handleDeleteTrigger = () => {
    reset()
  }

  const handleAddAction = (data: AutomationScheduledActionSchema) => {
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
    reset()
    setIsCreating(false)
  }

  const { createButlerAction } = useCreateButler(boardSlug, ButlerCategory.SCHEDULED)

  const onSubmit: SubmitHandler<CreateScheduledSchema> = (data) => {
    const transformedData = transformRuleForBackend(data)
    createButlerQueries({
      queryClient,
      boardSlug,
      category: ButlerCategory.SCHEDULED,
      details: transformedData
    })

    createButlerAction.execute({
      boardSlug,
      handlerKey: transformedData.trigger.handlerKey,
      category: ButlerCategory.SCHEDULED,
      trigger: transformedData.trigger,
      actions: transformedData.actions
    })

    setIsCreating(false)
    reset()
  }

  if (isCreating) {
    return (
      <div className='flex flex-col gap-4'>
        <div className='flex items-center gap-2'>
          <p className='text-2xl font-semibold flex-1'>Create a scheduled automation</p>
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

        <div className='px-4'>
          <div className='flex flex-col gap-4 mb-6'>
            <p className='font-semibold'>Trigger</p>
            {trigger ? (
              <TriggerCard trigger={trigger} onDelete={handleDeleteTrigger} />
            ) : (
              <div className='w-full h-14 bg-muted rounded-sm flex justify-center items-center mb-6'>
                <p className='text-sm'>
                  Your automation doesn&apos;t have a trigger yet. Select a trigger for the automation below.
                </p>
              </div>
            )}
          </div>

          {trigger ? (
            <div className='flex flex-col gap-4'>
              <p className='font-semibold'>Actions</p>
              {fields.length === 0 && (
                <div className='w-full h-14 bg-muted rounded-sm flex justify-center items-center mb-4'>
                  <p className='text-sm'>
                    Your automation doesn&apos;t perform any actions yet. Add some actions from below.
                  </p>
                </div>
              )}

              {fields.length > 0 && (
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
              )}

              {(fields.length === 0 || addMoreAction) && (
                <div className='flex flex-col gap-4 mt-4'>
                  <p className='font-semibold'>Select an Action</p>
                  <div className='space-y-3'>
                    {scheduledActionTemplates.map((action) => (
                      <ActionFormCard
                        key={action.id}
                        action={action}
                        lists={lists}
                        onAdd={handleAddAction}
                        schema={automationScheduledActionSchema}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className='space-y-4'>
              <p className='font-semibold'>Select Trigger</p>

              {scheduledTriggerTemplates.map((rule) => (
                <TriggerFormCard
                  key={rule.id}
                  rule={rule}
                  onSelect={handleSelectTrigger}
                  schema={automationScheduledTriggerSchema}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    )
  } else if (schedules.length) {
    return (
      <>
        <div className='flex items-center gap-2'>
          <p className='text-2xl font-semibold flex-1'>Rules</p>
          <Button className='mt-2' onClick={() => setIsCreating(true)}>
            <p className='font-bold'>Create automation</p>
          </Button>
        </div>
        <Separator className='mt-4 mb-10' />

        <div className='space-y-4'>
          {schedules.map((rule) => (
            <ButlerCard key={rule.id} rule={rule} lists={lists} />
          ))}
        </div>
      </>
    )
  } else {
    return (
      <>
        <p className='text-2xl font-semibold'>Scheduled automations</p>
        <Separator className='mt-4 mb-2' />

        <div className='grid grid-cols-12 p-4 gap-6'>
          <div className='col-span-6 space-y-4'>
            <p className='text-2xl font-semibold'>Make your schedule work for you with actions based on a schedule.</p>

            <p>Examples:</p>

            <div className='p-4 space-y-4'>
              <div className='flex items-start gap-3'>
                <Bot className='size-6 text-primary shrink-0' />
                <p>
                  <span className='font-bold'>Every day at 8:55am, sort the list</span> &quot;Backlog&quot; by due date.
                </p>
              </div>

              <div className='flex items-start gap-3'>
                <Bot className='size-6 text-primary shrink-0' />
                <p>
                  <span className='font-bold'>Every third Wednesday of the month, create a card</span> called
                  &quot;Planning Meeting&quot; to the list &quot;To Do&quot; and{' '}
                  <span className='font-bold'>add member</span> @JohnSmith to the card.
                </p>
              </div>

              <div className='flex items-start gap-3'>
                <Bot className='size-6 text-primary shrink-0' />
                <p>
                  <span className='font-bold'>Every year on the 14th of February, create a list</span> called
                  &quot;Valentine&apos;s Day Ideas&quot;.
                </p>
              </div>

              <Button className='mt-2' onClick={() => setIsCreating(true)}>
                <p className='font-bold'>Create automation</p>
              </Button>
            </div>
          </div>
          <div className='col-span-6'>
            <iframe
              className='w-full h-60 rounded-md'
              src='https://www.youtube.com/embed/-f7Xw8iomW8?si=mvGqnkmTTBoGU8vH'
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
}
