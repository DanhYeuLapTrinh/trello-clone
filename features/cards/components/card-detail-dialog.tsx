'use client'

import Editor from '@/components/editor'
import SanitizedHtml from '@/components/sanitized-html'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import LabelPopover from '@/features/labels/components/label-popover'
import SubtaskPopover from '@/features/subtasks/components/subtask-popover'
import SubtaskSection from '@/features/subtasks/components/subtask-section'
import { cn, getColorTextClass } from '@/lib/utils'
import { useQuery } from '@tanstack/react-query'
import { ImageIcon, MessageSquareText, MoreHorizontal, Paperclip, Plus, Tag, TextAlignStart, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { SubmitHandler } from 'react-hook-form'
import { getCard } from '../actions'
import { useUpdateCard } from '../hooks/use-update-card'
import { UpdateCardSchema } from '../validations'
import AsigneePopover from './popover/asignee-popover'
import DatePopover from './popover/date-popover'

interface CardDetailDialogProps {
  children?: React.ReactNode
  isOpen: boolean
  cardSlug: string
  boardSlug: string
}

export default function CardDetailDialog({ children, isOpen, cardSlug, boardSlug }: CardDetailDialogProps) {
  const router = useRouter()

  const { data: cardDetail } = useQuery({
    queryKey: ['card', boardSlug, cardSlug],
    queryFn: () => getCard(cardSlug)
  })

  const [internalOpen, setInternalOpen] = useState(isOpen)
  const [isEditDescription, setIsEditDescription] = useState(false)
  const [isEditTitle, setIsEditTitle] = useState(false)
  const [openParentId, setOpenParentId] = useState<string | null>(null)

  const { methods, updateCardAction } = useUpdateCard()

  const formTitle = methods.watch('title')
  const formDescription = methods.watch('description')

  const hasSubtasks = cardDetail!.subtasks && Array.isArray(cardDetail!.subtasks) && cardDetail!.subtasks.length > 0
  const hadCardLabels =
    cardDetail!.cardLabels && Array.isArray(cardDetail!.cardLabels) && cardDetail!.cardLabels.length > 0

  const handleClose = () => {
    setInternalOpen(false)
    setOpenParentId(null)
    setIsEditDescription(false)
    setIsEditTitle(false)
    router.back()
  }

  const startEditDescription = () => {
    methods.reset({
      title: '',
      cardId: cardDetail!.id,
      description: cardDetail!.description || '',
      boardSlug
    })
    setIsEditDescription(true)
  }

  const cancelEditDescription = () => {
    setIsEditDescription(false)
  }

  const startEditTitle = () => {
    methods.reset({
      title: cardDetail!.title,
      cardId: cardDetail!.id,
      description: '',
      boardSlug
    })
    setIsEditTitle(true)
  }

  const onBlurTitle = () => {
    if (formTitle === cardDetail!.title) {
      setIsEditTitle(false)
      return
    }

    methods.handleSubmit(onSubmit)()
  }

  const onSaveDescription = () => {
    if (formDescription === cardDetail!.description) {
      setIsEditDescription(false)
      return
    }

    methods.handleSubmit(onSubmit)()
  }

  const onSubmit: SubmitHandler<UpdateCardSchema> = async (data) => {
    await updateCardAction.executeAsync(data)

    setIsEditDescription(false)
    setIsEditTitle(false)
    methods.reset()
  }

  return (
    <Dialog open={internalOpen} onOpenChange={handleClose}>
      {children && <DialogTrigger className='w-full text-left'>{children}</DialogTrigger>}

      <DialogContent
        showCloseButton={false}
        className='p-0 gap-0 overflow-auto'
        position='tc'
        size='xxl'
        aria-describedby='card-detail-dialog'
      >
        <Form {...methods}>
          <div className='p-6 py-3 flex items-center justify-between gap-2'>
            <Badge variant='secondary' className='inline-flex px-3 py-0.5'>
              <p className='text-sm'>{cardDetail!.list.name}</p>
            </Badge>
            <div className='flex items-center gap-2'>
              <Button className='rounded-full' variant='ghost' size='icon'>
                <ImageIcon className='size-4.5' />
              </Button>
              <Button className='rounded-full' variant='ghost' size='icon'>
                <MoreHorizontal className='size-4.5' />
              </Button>
              <Button className='rounded-full' variant='ghost' size='icon' onClick={handleClose}>
                <X className='size-5' />
              </Button>
            </div>
          </div>

          <Separator />

          <div className='flex-1'>
            <div className='grid grid-cols-12'>
              <div className='col-span-7 p-6 border-r border-border overflow-auto max-h-[calc(100vh-7rem)]'>
                <div className='flex items-start gap-3'>
                  <Checkbox className='rounded-full border-foreground mt-2' />
                  <div className='space-y-6'>
                    {isEditTitle ? (
                      <FormField
                        control={methods.control}
                        name='title'
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Textarea
                                className='!text-2xl font-bold resize-none'
                                defaultValue={field.value}
                                onChange={field.onChange}
                                onBlur={onBlurTitle}
                                autoFocus
                                onFocus={(e) => {
                                  setTimeout(() => {
                                    e.target.setSelectionRange(0, e.target.value.length, 'forward')
                                  }, 0)
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ) : (
                      <p className='text-2xl font-bold' onClick={startEditTitle}>
                        {formTitle ? formTitle : cardDetail!.title}
                      </p>
                    )}

                    <div className='flex items-center gap-2 flex-wrap'>
                      {!hadCardLabels ? (
                        <LabelPopover
                          boardSlug={boardSlug}
                          cardSlug={cardDetail!.slug}
                          cardLabels={cardDetail!.cardLabels || []}
                        >
                          <Button variant='outline' size='sm'>
                            <Tag className='size-3.5' />
                            <p className='text-xs'>Nhãn</p>
                          </Button>
                        </LabelPopover>
                      ) : null}

                      <DatePopover />

                      <SubtaskPopover boardSlug={boardSlug} cardSlug={cardDetail!.slug} />

                      <AsigneePopover />

                      <Button variant='outline' size='sm'>
                        <Paperclip className='size-3.5' />
                        <p className='text-xs'>Đính kèm</p>
                      </Button>
                    </div>

                    {hadCardLabels ? (
                      <div className='space-y-1 mt-8'>
                        <p className='text-xs font-semibold text-muted-foreground'>Nhãn</p>
                        <div className='flex items-center gap-1 flex-wrap'>
                          {cardDetail!.cardLabels?.map((cardLabel) => (
                            <div
                              className={cn(
                                'min-w-14 px-3 h-8 rounded-md flex justify-center items-center',
                                cardLabel.label.color || 'bg-muted-foreground/5'
                              )}
                              key={cardLabel.id}
                            >
                              {cardLabel.label.title ? (
                                <p
                                  className={cn(
                                    'text-sm font-semibold',
                                    getColorTextClass(cardLabel.label.color ?? '')
                                  )}
                                >
                                  {cardLabel.label.title}
                                </p>
                              ) : null}
                            </div>
                          ))}

                          <LabelPopover
                            boardSlug={boardSlug}
                            cardSlug={cardDetail!.slug}
                            cardLabels={cardDetail!.cardLabels || []}
                          >
                            <Button variant='secondary' size='icon' className='size-8'>
                              <Plus />
                            </Button>
                          </LabelPopover>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className='flex items-start gap-3 mt-8 mb-6'>
                  <TextAlignStart className='size-5 stroke-[2.5]' />
                  <div className='space-y-2 w-full'>
                    <p className='text-sm font-bold'>Mô tả</p>

                    {!isEditDescription ? (
                      cardDetail!.description ? (
                        // FIXME: overflow if content is too long
                        <div className='cursor-pointer hover:bg-muted mt-4' onClick={startEditDescription}>
                          <SanitizedHtml html={cardDetail!.description} />
                        </div>
                      ) : (
                        <Textarea
                          onFocus={startEditDescription}
                          placeholder='Thêm mô tả chi tiết hơn...'
                          className='resize-none w-full font-semibold mt-4'
                        />
                      )
                    ) : null}

                    <FormField
                      control={methods.control}
                      name='description'
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Editor
                              isDisplay={isEditDescription}
                              onSave={onSaveDescription}
                              onCancel={cancelEditDescription}
                              isSaving={updateCardAction.isPending}
                              content={field.value || ''}
                              onChange={(value) => field.onChange(value)}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {hasSubtasks ? (
                  <SubtaskSection
                    subtasks={cardDetail!.subtasks}
                    boardSlug={boardSlug}
                    cardSlug={cardDetail!.slug}
                    openParentId={openParentId}
                    setOpenParentId={setOpenParentId}
                  />
                ) : null}
              </div>

              <div className='col-span-5 p-6 bg-muted rounded-br-md'>
                <div className='flex items-center gap-2 mb-4'>
                  <MessageSquareText className='size-4' />
                  <p className='text-sm font-bold'>Nhận xét và hoạt động</p>
                </div>

                <Input placeholder='Viết bình luận...' className='font-semibold bg-background' />
              </div>
            </div>
          </div>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
