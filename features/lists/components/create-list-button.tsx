'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Loader2, Plus } from 'lucide-react'
import { useState } from 'react'
import { SubmitHandler } from 'react-hook-form'
import { useCreateList } from '../hooks/use-create-list'
import { CreateListSchema } from '../validations'

export default function CreateListButton({ boardId, slug }: { boardId: string; slug: string }) {
  const [isAdding, setIsAdding] = useState(false)

  const toggleAdding = () => {
    setIsAdding((prev) => !prev)
  }

  const { methods, createListAction } = useCreateList(boardId, slug, toggleAdding)

  const onSubmit: SubmitHandler<CreateListSchema> = (data) => {
    createListAction.execute(data)
  }

  if (isAdding) {
    return (
      <Card className='w-72 p-2'>
        <Form {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)} className='w-full flex flex-col gap-2'>
            <FormField
              control={methods.control}
              name='name'
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder='Nhập tên danh sách...'
                      autoFocus
                      onBlur={() => {
                        if (createListAction.isPending || field.value) return
                        toggleAdding()
                      }}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <Button className='w-full' type='submit' disabled={createListAction.isPending}>
              {createListAction.isPending ? <Loader2 className='w-4 h-4 animate-spin' /> : 'Thêm danh sách'}
            </Button>
          </form>
        </Form>
      </Card>
    )
  } else {
    return (
      <Button
        variant='secondary'
        className='text-white bg-muted/20 hover:bg-muted/20 hover:text-white w-72'
        onClick={toggleAdding}
      >
        <Plus />
        Thêm danh sách khác
      </Button>
    )
  }
}
