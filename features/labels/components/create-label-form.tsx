import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { sortedCardLabelColors } from '@/shared/constants'
import { cn, getColorTextClass } from '@/shared/utils'
import { useQueryClient } from '@tanstack/react-query'
import { Loader2, X } from 'lucide-react'
import { useEffect } from 'react'
import { SubmitHandler } from 'react-hook-form'
import { useCreateLabel } from '../hooks/use-create-label'
import { LabelAction } from '../types'
import { createLabelWithAssignmentQueries } from '../utils'
import { CreateLabelSchema } from '../validations'

interface CreateLabelProps {
  boardSlug: string
  cardSlug: string
  labelAction: LabelAction | null
  setLabelAction: (labelAction: LabelAction | null) => void
}

export default function CreateLabelForm({ boardSlug, cardSlug, labelAction, setLabelAction }: CreateLabelProps) {
  const queryClient = useQueryClient()
  const { methods: createLabelMethods, createLabelAction } = useCreateLabel(boardSlug, cardSlug)

  const { watch, setValue, handleSubmit } = createLabelMethods

  const color = watch('color')
  const title = watch('title')

  const onSubmitCreate: SubmitHandler<CreateLabelSchema> = (data) => {
    setLabelAction(null)

    const { color, title } = data
    createLabelWithAssignmentQueries(queryClient, boardSlug, cardSlug, title || '', color || '')

    createLabelAction.execute(data)
  }

  useEffect(() => {
    if (labelAction && labelAction.action === 'create') {
      const color = sortedCardLabelColors.flatMap((col) => col.shades).find((shade) => shade.isDefaultSelect)?.value
      setValue('color', color ?? '')
    }
  }, [labelAction, setValue])

  return (
    <>
      <div className='bg-muted h-24 flex justify-center items-center'>
        <div
          className={cn(
            color
              ? sortedCardLabelColors.flatMap((col) => col.shades).find((shade) => shade.value === color)?.value
              : 'bg-gray-200',
            'w-3/4 h-8 rounded-sm flex items-center px-3'
          )}
        >
          {title ? (
            <p className={cn('text-sm font-semibold truncate', getColorTextClass(color ?? ''))}>{title}</p>
          ) : null}
        </div>
      </div>
      <Form {...createLabelMethods}>
        <div className='p-2 space-y-2'>
          <div>
            <p className='font-semibold text-xs py-1 text-muted-foreground'>Tiêu đề</p>
            <FormField
              control={createLabelMethods.control}
              name='title'
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input className='w-full' {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
          <div>
            <p className='font-semibold text-xs py-1 text-muted-foreground'>Chọn một màu</p>
            <div className='grid grid-cols-5 gap-2'>
              {sortedCardLabelColors.map((col) => (
                <div key={col.baseColor} className='flex flex-col gap-2'>
                  {col.shades.map((shade) => (
                    <div
                      key={shade.value}
                      className={cn(
                        shade.value,
                        shade.value === color ? 'ring-2 ring-primary ring-offset-2' : '',
                        'w-full h-8 rounded cursor-pointer'
                      )}
                      onClick={() => setValue('color', shade.value)}
                    />
                  ))}
                </div>
              ))}
            </div>
            <div className='space-y-4 mt-4'>
              <Button className='w-full' variant='secondary' onClick={() => setValue('color', '')}>
                <X />
                Gỡ bỏ màu
              </Button>
              <Separator />
              <Button
                className='w-full'
                disabled={(!title && !color) || createLabelAction.isPending}
                onClick={handleSubmit(onSubmitCreate)}
              >
                {createLabelAction.isPending ? <Loader2 className='size-4 animate-spin' /> : 'Tạo mới'}
              </Button>
            </div>
          </div>
        </div>
      </Form>
    </>
  )
}
