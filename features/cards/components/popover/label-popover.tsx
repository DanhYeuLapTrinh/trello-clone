'use client'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Form } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { sortedCardLabelColors } from '@/lib/constants'
import { cn, getColorTextClass } from '@/lib/utils'
import { CardLabelDetail } from '@/types/common'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, Loader2, Pencil, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { SubmitHandler } from 'react-hook-form'
import { getBoardLabels } from '../../actions'
import { useAssignLabel } from '../../hooks/use-assign-label'
import { useCreateLabel } from '../../hooks/use-create-label'
import { useUnassignLabel } from '../../hooks/use-unassign-label'
import { AssignLabelSchema, CreateLabelSchema, UnassignLabelSchema } from '../../validations'

interface LabelAction {
  action: 'create' | 'edit'
  labelId: string | null
}

interface LabelPopoverProps {
  boardSlug: string
  cardSlug: string
  cardLabels: CardLabelDetail[]
  children?: React.ReactNode
}

// TODO: improve this component

export default function LabelPopover({ boardSlug, cardSlug, cardLabels, children }: LabelPopoverProps) {
  const [open, setOpen] = useState(false)
  const [labelAction, setLabelAction] = useState<LabelAction | null>(null)
  const [localCardLabels, setLocalCardLabels] = useState<CardLabelDetail[]>(cardLabels)

  const { methods: createLabelMethods, createLabelAction } = useCreateLabel(boardSlug, cardSlug)
  const { methods: assignLabelMethods, assignLabelAction } = useAssignLabel(boardSlug, cardSlug)
  const { methods: unassignLabelMethods, unassignLabelAction } = useUnassignLabel(boardSlug, cardSlug)

  const color = createLabelMethods.watch('color')
  const title = createLabelMethods.watch('title')

  const { data: boardLabels } = useQuery({
    queryKey: ['board', 'labels', boardSlug],
    queryFn: () => getBoardLabels(boardSlug)
  })

  const handleClose = () => {
    setOpen(false)
    setTimeout(() => {
      setLabelAction(null)
    }, 100)
  }

  const onSubmitCreate: SubmitHandler<CreateLabelSchema> = async (data) => {
    await createLabelAction.executeAsync(data)
    setTimeout(() => {
      setLabelAction(null)
    }, 100)
  }

  const onSubmitAssign: SubmitHandler<AssignLabelSchema> = (data) => {
    assignLabelAction.execute(data)
  }

  const onSubmitUnassign: SubmitHandler<UnassignLabelSchema> = (data) => {
    unassignLabelAction.execute(data)
  }

  const handleLabelToggle = (labelId: string, isCurrentlyAssigned: boolean) => {
    if (isCurrentlyAssigned) {
      setLocalCardLabels((prev) => prev.filter((cardLabel) => cardLabel.labelId !== labelId))
    } else {
      const tempLabel: CardLabelDetail = {
        labelId,
        cardId: '',
        id: `temp-${labelId}`,
        label: {
          id: labelId,
          title: null,
          color: null,
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          boardId: null
        }
      }
      setLocalCardLabels((prev) => [...prev, tempLabel])
    }

    if (isCurrentlyAssigned) {
      unassignLabelMethods.setValue('labelId', labelId)
      unassignLabelMethods.handleSubmit(onSubmitUnassign)()
    } else {
      assignLabelMethods.setValue('labelId', labelId)
      assignLabelMethods.handleSubmit(onSubmitAssign)()
    }
  }

  useEffect(() => {
    setLocalCardLabels(cardLabels)
  }, [cardLabels])

  useEffect(() => {
    if (labelAction && labelAction.action === 'create') {
      const color = sortedCardLabelColors.flatMap((col) => col.shades).find((shade) => shade.isDefaultSelect)?.value
      createLabelMethods.setValue('color', color ?? '')
    }
  }, [labelAction, createLabelMethods])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent side='bottom' align='start' className='p-0 w-[304px]'>
        <div className='flex items-center w-full p-2'>
          {labelAction ? (
            <div className='flex-1 flex justify-start'>
              <Button variant='ghost' size='icon' onClick={() => setLabelAction(null)}>
                <ChevronLeft className='size-4' />
              </Button>
            </div>
          ) : (
            <div className='flex-1' />
          )}
          <p className='font-semibold text-sm text-center text-muted-foreground'>
            {labelAction ? (labelAction.action === 'create' ? 'Tạo nhãn mới' : 'Chỉnh sửa nhãn') : 'Nhãn'}
          </p>
          <div className='flex-1 flex justify-end'>
            <Button variant='ghost' size='icon' onClick={handleClose}>
              <X className='size-4' />
            </Button>
          </div>
        </div>

        {labelAction ? (
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
                  <div className='flex items-center gap-2'>
                    <Input className='w-full' onChange={(e) => createLabelMethods.setValue('title', e.target.value)} />
                  </div>
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
                            onClick={() => createLabelMethods.setValue('color', shade.value)}
                          />
                        ))}
                      </div>
                    ))}
                  </div>
                  <div className='space-y-4 mt-4'>
                    <Button
                      className='w-full'
                      variant='secondary'
                      onClick={() => createLabelMethods.setValue('color', '')}
                    >
                      <X />
                      Gỡ bỏ màu
                    </Button>
                    <Separator />
                    <Button
                      className='w-full'
                      disabled={(!title && !color) || createLabelAction.isPending}
                      onClick={createLabelMethods.handleSubmit(onSubmitCreate)}
                    >
                      {createLabelAction.isPending ? <Loader2 className='size-4 animate-spin' /> : 'Tạo mới'}
                    </Button>
                  </div>
                </div>
              </div>
            </Form>
          </>
        ) : (
          <div className='p-2 space-y-2'>
            <Input placeholder='Tìm nhãn...' />
            <p className='font-medium text-xs text-muted-foreground py-1'>Nhãn</p>

            <div className='space-y-0'>
              {boardLabels?.map((label) => (
                <div key={label.id} className='flex items-center gap-1 pl-1'>
                  <Checkbox
                    className='mr-2'
                    checked={localCardLabels.some((cardLabel) => cardLabel.labelId === label.id)}
                    onCheckedChange={() => {
                      const isCurrentlyAssigned = localCardLabels.some((cardLabel) => cardLabel.labelId === label.id)
                      handleLabelToggle(label.id, isCurrentlyAssigned)
                    }}
                  />
                  <div className={cn(label.color, 'flex-1 min-w-0 h-8 rounded-sm flex items-center px-2')}>
                    {label.title ? (
                      <p className={cn('text-sm font-semibold truncate', getColorTextClass(label.color ?? ''))}>
                        {label.title}
                      </p>
                    ) : null}
                  </div>
                  <Button variant='ghost' size='icon' onClick={() => setLabelAction({ action: 'edit', labelId: null })}>
                    <Pencil className='size-3.5' />
                  </Button>
                </div>
              ))}

              {sortedCardLabelColors
                .slice(0, 7 - (boardLabels?.length ?? 0))
                .filter(
                  (color) =>
                    !boardLabels?.some(
                      (label) => label.color === color.shades.find((shade) => shade.isDefaultDisplay)?.value
                    )
                )
                .map((color) => (
                  <div key={color.baseColor}>
                    {color.shades.map((shade) => {
                      if (shade.isDefaultDisplay) {
                        return (
                          <div key={shade.value} className='flex items-center gap-1 pl-1'>
                            <Checkbox
                              className='mr-2'
                              checked={localCardLabels.some((cardLabel) => cardLabel.label.color === shade.value)}
                              onCheckedChange={() => {
                                const isCurrentlyAssigned = localCardLabels.some(
                                  (cardLabel) => cardLabel.label.color === shade.value
                                )

                                if (!isCurrentlyAssigned) {
                                  const labelId = Date.now().toString()
                                  const tempLabel: CardLabelDetail = {
                                    labelId,
                                    cardId: '',
                                    id: `temp-${labelId}`,
                                    label: {
                                      id: labelId,
                                      title: null,
                                      color: shade.value,
                                      isDeleted: false,
                                      createdAt: new Date(),
                                      updatedAt: new Date(),
                                      boardId: null
                                    }
                                  }
                                  setLocalCardLabels((prev) => [...prev, tempLabel])

                                  createLabelAction.execute({
                                    boardSlug,
                                    cardSlug,
                                    color: shade.value
                                  })
                                }
                              }}
                            />
                            <div
                              className={cn(
                                color.shades.find((shade) => shade.isDefaultDisplay)?.value,
                                'w-full h-8 rounded-sm'
                              )}
                            />
                            <Button
                              variant='ghost'
                              size='icon'
                              onClick={() => setLabelAction({ action: 'edit', labelId: null })}
                            >
                              <Pencil className='size-3.5' />
                            </Button>
                          </div>
                        )
                      } else {
                        return null
                      }
                    })}
                  </div>
                ))}
            </div>

            <Button
              variant='secondary'
              className='w-full mt-2'
              onClick={() => setLabelAction({ action: 'create', labelId: null })}
            >
              Tạo nhãn mới
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
