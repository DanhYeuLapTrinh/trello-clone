'use client'

import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Loader2, SquareCheckBig, X } from 'lucide-react'
import { useState } from 'react'
import { SubmitHandler } from 'react-hook-form'
import { useCreateSubtask } from '../hooks/use-create-subtask'
import { CreateSubtaskSchema } from '../validations'

interface SubtaskPopoverProps {
  boardSlug: string
  cardSlug: string
}

export default function SubtaskPopover({ boardSlug, cardSlug }: SubtaskPopoverProps) {
  const [open, setOpen] = useState(false)
  const { methods, createSubtaskAction } = useCreateSubtask({
    defaultValues: {
      boardSlug,
      cardSlug,
      title: 'Việc cần làm'
    },
    boardSlug,
    cardSlug
  })

  const onSubmit: SubmitHandler<CreateSubtaskSchema> = async (data) => {
    await createSubtaskAction.executeAsync(data)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant='outline' size='sm'>
          <SquareCheckBig className='size-3.5' />
          <p className='text-xs'>Việc cần làm</p>
        </Button>
      </PopoverTrigger>
      <PopoverContent side='bottom' align='start' className='space-y-2 p-2'>
        <div className='flex items-center w-full'>
          <div className='flex-1' />
          <p className='font-semibold text-sm text-center text-muted-foreground'>Thêm danh sách công việc</p>
          <div className='flex-1 flex justify-end'>
            <Button variant='ghost' size='icon' onClick={() => setOpen(false)}>
              <X className='size-4' />
            </Button>
          </div>
        </div>

        <Form {...methods}>
          <div>
            <p className='font-semibold text-xs'>Tiêu đề</p>
            <FormField
              control={methods.control}
              name='title'
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Button className='w-full' onClick={methods.handleSubmit(onSubmit)} disabled={createSubtaskAction.isPending}>
            {createSubtaskAction.isPending ? <Loader2 className='size-4 animate-spin' /> : 'Thêm'}
          </Button>
        </Form>
      </PopoverContent>
    </Popover>
  )
}
