import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { sortedCardLabelColors } from '@/shared/constants'
import { cn, getColorTextClass } from '@/shared/utils'
import { useQueryClient } from '@tanstack/react-query'
import { Loader2, X } from 'lucide-react'
import { SubmitHandler } from 'react-hook-form'
import { useCreateLabel } from '../hooks/use-create-label'
import { useDeleteLabel } from '../hooks/use-delete-label'
import { useUpdateLabel } from '../hooks/use-update-label'
import { LabelAction } from '../types'
import { createLabelWithAssignmentQueries, deleteLabelFromQueries, updateLabelInQueries } from '../utils'
import { UpdateLabelSchema } from '../validations'

interface UpdateLabelFormProps {
  boardSlug: string
  cardSlug: string
  labelAction: LabelAction | null
  setLabelAction: (labelAction: LabelAction | null) => void
  isDelete: boolean
  setIsDelete: (isDelete: boolean) => void
}

export default function UpdateLabelForm({
  boardSlug,
  cardSlug,
  labelAction,
  setLabelAction,
  isDelete,
  setIsDelete
}: UpdateLabelFormProps) {
  const queryClient = useQueryClient()

  const { methods: updateLabelMethods, updateLabelAction } = useUpdateLabel({
    boardSlug,
    cardSlug,
    labelId: labelAction?.label?.id || '',
    title: labelAction?.label?.title || '',
    color: labelAction?.label?.color || ''
  })

  const { deleteLabelAction } = useDeleteLabel(boardSlug, cardSlug)
  const { createLabelAction } = useCreateLabel(boardSlug, cardSlug)

  const { watch, setValue, handleSubmit } = updateLabelMethods

  const color = watch('color')
  const title = watch('title')

  const onSubmit: SubmitHandler<UpdateLabelSchema> = (data) => {
    setLabelAction(null)

    updateLabelInQueries(queryClient, boardSlug, cardSlug, data.labelId, {
      title: data.title,
      color: data.color
    })

    updateLabelAction.execute(data)
  }

  const handleDeleteLabel = () => {
    if (!labelAction?.label?.id) return

    deleteLabelFromQueries(queryClient, boardSlug, cardSlug, labelAction.label.id)

    setIsDelete(false)
    setLabelAction(null)
    deleteLabelAction.execute({ labelId: labelAction?.label?.id, boardSlug, cardSlug })
  }

  const onCreate: SubmitHandler<UpdateLabelSchema> = (data) => {
    setLabelAction(null)

    const { color, title } = data
    createLabelWithAssignmentQueries(queryClient, boardSlug, cardSlug, title || '', color || '')

    createLabelAction.execute(data)
  }

  if (isDelete) {
    return (
      <div className='px-3 pb-3 space-y-2'>
        <p className='text-sm'>Việc này sẽ xóa nhãn này khỏi tất cả các thẻ. Không có hoàn tác.</p>
        <Button className='w-full' variant='destructive' onClick={handleDeleteLabel}>
          Xóa
        </Button>
      </div>
    )
  }

  if (labelAction?.action === 'update' && labelAction.label) {
    if (labelAction.label.id.startsWith('label-')) {
      // Temp label (has not created in DB)
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
          <Form {...updateLabelMethods}>
            <div className='p-2 space-y-2'>
              <div>
                <p className='font-semibold text-xs py-1 text-muted-foreground'>Tiêu đề</p>
                <FormField
                  control={updateLabelMethods.control}
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

                  <Button disabled={(!title && !color) || updateLabelAction.isPending} onClick={handleSubmit(onCreate)}>
                    {updateLabelAction.isPending ? <Loader2 className='size-4 animate-spin' /> : 'Lưu'}
                  </Button>
                </div>
              </div>
            </div>
          </Form>
        </>
      )
    } else {
      // Created label (has created in DB)
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
          <Form {...updateLabelMethods}>
            <div className='p-2 space-y-2'>
              <div>
                <p className='font-semibold text-xs py-1 text-muted-foreground'>Tiêu đề</p>
                <FormField
                  control={updateLabelMethods.control}
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

                  <div className='flex items-center gap-2 justify-between'>
                    <Button
                      disabled={(!title && !color) || updateLabelAction.isPending}
                      onClick={handleSubmit(onSubmit)}
                    >
                      {updateLabelAction.isPending ? <Loader2 className='size-4 animate-spin' /> : 'Lưu'}
                    </Button>
                    <Button variant='destructive' onClick={() => setIsDelete(true)}>
                      Xóa
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Form>
        </>
      )
    }
  }

  return null
}
