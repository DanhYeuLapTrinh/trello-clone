'use client'

import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Loader2 } from 'lucide-react'
import { SubmitHandler } from 'react-hook-form'
import { useCreateSubtask } from '../../hooks/use-create-subtask'
import { CreateSubtaskSchema } from '../../validations'

interface CreateSubtaskButtonProps {
  boardSlug: string
  cardSlug: string
  parentId: string
  isOpen: boolean
  onOpen: () => void
  onClose: () => void
}

export default function CreateSubtaskButton({
  boardSlug,
  cardSlug,
  parentId,
  isOpen,
  onOpen,
  onClose
}: CreateSubtaskButtonProps) {
  const { methods, createSubtaskAction } = useCreateSubtask({
    defaultValues: {
      boardSlug,
      cardSlug,
      title: '',
      parentId
    }
  })

  const onSubmit: SubmitHandler<CreateSubtaskSchema> = (data) => {
    createSubtaskAction.execute(data)
  }

  if (isOpen) {
    return (
      <Form {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)} className='w-full flex flex-col gap-2'>
          <FormField
            control={methods.control}
            name='title'
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input {...field} placeholder='Nhập tiêu đề hoặc dán liên kết' autoFocus />
                </FormControl>
              </FormItem>
            )}
          />
          <div className='flex items-center gap-2'>
            <Button type='submit' disabled={createSubtaskAction.isPending}>
              {createSubtaskAction.isPending ? <Loader2 className='w-4 h-4 animate-spin' /> : 'Thêm'}
            </Button>
            <Button
              type='button'
              variant='ghost'
              disabled={createSubtaskAction.isPending}
              onClick={() => {
                methods.setValue('title', '')
                onClose()
              }}
            >
              Hủy
            </Button>
          </div>
        </form>
      </Form>
    )
  }

  return (
    <Button variant='secondary' onClick={onOpen}>
      Thêm một mục
    </Button>
  )
}
