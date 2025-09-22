'use client'

import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Loader2, Plus } from 'lucide-react'
import { useState } from 'react'
import { SubmitHandler } from 'react-hook-form'
import { useCreateCard } from '../hooks/use-create-card'
import { CreateCardSchema } from '../validations'

export default function CreateCardButton({ listId, slug }: { listId: string; slug: string }) {
  const [isAdding, setIsAdding] = useState(false)

  const toggleAdding = () => {
    setIsAdding((prev) => !prev)
  }

  const { methods, createCardAction } = useCreateCard(listId, slug, toggleAdding)

  const onSubmit: SubmitHandler<CreateCardSchema> = (data) => {
    createCardAction.execute(data)
  }

  if (isAdding) {
    return (
      <Form {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)} className='w-full flex flex-col gap-2'>
          <FormField
            control={methods.control}
            name='title'
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    {...field}
                    placeholder='Nhập tiêu đề hoặc dán liên kết'
                    autoFocus
                    onBlur={() => {
                      if (field.value) return
                      toggleAdding()
                    }}
                    // prevent dnd
                    onMouseDown={(e) => e.stopPropagation()}
                    onPointerDown={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <Button
            className='w-full'
            type='submit'
            disabled={createCardAction.isPending}
            // prevent dnd
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            {createCardAction.isPending ? <Loader2 className='w-4 h-4 animate-spin' /> : 'Thêm danh sách'}
          </Button>
        </form>
      </Form>
    )
  } else {
    return (
      <Button
        variant='ghost'
        className='hover:bg-muted-foreground/20 justify-start'
        onClick={toggleAdding}
        // prevent dnd
        onMouseDown={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <Plus className='size-4' />
        Thêm thẻ
      </Button>
    )
  }
}
