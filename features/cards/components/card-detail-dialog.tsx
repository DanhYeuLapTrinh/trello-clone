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
import UploadFilesWrapper from '@/components/upload-files-wrapper'
import { useCreateComment } from '@/features/comments/hooks/use-create-comment'
import { createCommentQueries, updateCardBackgroundQueries } from '@/features/comments/utils'
import LabelPopover from '@/features/labels/components/label-popover'
import SubtaskPopover from '@/features/subtasks/components/subtask-popover'
import SubtaskSection from '@/features/subtasks/components/subtask-section'
import { FILE_TYPE_GROUPS } from '@/lib/constants'
import { cn, getColorTextClass } from '@/lib/utils'
import { FileInfo } from '@/types/common'
import { useUser } from '@clerk/nextjs'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ChevronDown,
  Clock,
  ImageIcon,
  MessageSquareText,
  MoreHorizontal,
  Paperclip,
  Plus,
  Tag,
  TextAlignStart,
  X
} from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { SubmitHandler } from 'react-hook-form'
import { getCard, getCardActivitiesAndComments } from '../actions'
import { useUpdateCard } from '../hooks/use-update-card'
import { useUpdateCardBackground } from '../hooks/use-update-card-background'
import {
  formatCardDate,
  formatCardDateTime,
  getCardDateLabel,
  hasCardDates,
  hasCardLabels,
  hasSubtasks
} from '../utils'
import { UpdateCardSchema } from '../validations'
import AsigneePopover from './popover/asignee-popover'
import DatePopover from './popover/date-popover'
import Timeline from './timeline'

interface CardDetailDialogProps {
  children?: React.ReactNode
  isOpen: boolean
  cardSlug: string
  boardSlug: string
}

export default function CardDetailDialog({ children, isOpen, cardSlug, boardSlug }: CardDetailDialogProps) {
  const router = useRouter()
  const queryClient = useQueryClient()

  const { user } = useUser()

  const { data: cardDetail } = useQuery({
    queryKey: ['card', boardSlug, cardSlug],
    queryFn: () => getCard(cardSlug)
  })

  const { data: timelines } = useQuery({
    queryKey: ['card', 'activities', 'comments', boardSlug, cardSlug],
    queryFn: () => getCardActivitiesAndComments(cardSlug)
  })

  const [internalOpen, setInternalOpen] = useState(isOpen)
  const [isEditDescription, setIsEditDescription] = useState(false)
  const [isEditTitle, setIsEditTitle] = useState(false)
  const [openParentId, setOpenParentId] = useState<string | null>(null)
  const [comment, setComment] = useState('')

  const { methods, updateCardAction } = useUpdateCard()
  const { createCommentAction } = useCreateComment(boardSlug, cardSlug)
  const { updateCardBackgroundAction } = useUpdateCardBackground(boardSlug, cardSlug)

  const formTitle = methods.watch('title')
  const formDescription = methods.watch('description')

  const cardHasSubtasks = hasSubtasks(cardDetail!.subtasks)
  const hadCardLabels = hasCardLabels(cardDetail!.cardLabels)
  const hadCardDates = hasCardDates(cardDetail!.startDate, cardDetail!.endDate)

  const isDisplayRow = hadCardDates || hadCardLabels

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

  const handleCreateCommment = () => {
    createCommentQueries({
      queryClient,
      boardSlug,
      cardSlug,
      content: comment,
      firstName: user?.firstName ?? '',
      lastName: user?.lastName ?? '',
      imageUrl: user?.imageUrl ?? ''
    })

    createCommentAction.execute({
      boardSlug,
      cardSlug,
      content: comment
    })

    setComment('')
  }

  const onSuccessUploadBackground = (files: FileInfo[]) => {
    updateCardBackgroundQueries(queryClient, boardSlug, cardSlug, files[0].url)

    updateCardBackgroundAction.execute({
      cardSlug,
      boardSlug,
      imageUrl: files[0].url
    })
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
          {cardDetail!.imageUrl ? (
            <div className='relative h-[160px] w-full'>
              <div className='absolute top-4 left-4 z-20'>
                <Badge variant='secondary' className='inline-flex px-3 py-0.5'>
                  <p className='text-sm'>{cardDetail!.list.name}</p>
                </Badge>
              </div>

              <Image src={cardDetail!.imageUrl} alt={cardDetail!.title} fill className='object-contain' />

              <div className='absolute top-4 right-4 z-20 flex items-center gap-2'>
                <UploadFilesWrapper
                  onSuccess={onSuccessUploadBackground}
                  disabled={updateCardBackgroundAction.isPending}
                  allowedTypes={FILE_TYPE_GROUPS.IMAGES}
                  className='rounded-full'
                  variant='secondary'
                  size='icon'
                >
                  <ImageIcon className='size-4.5' />
                </UploadFilesWrapper>
                <Button className='rounded-full' variant='secondary' size='icon'>
                  <MoreHorizontal className='size-4.5' />
                </Button>
                <Button className='rounded-full' variant='secondary' size='icon' onClick={handleClose}>
                  <X className='size-5' />
                </Button>
              </div>
            </div>
          ) : (
            <div className='px-3 py-2 flex items-center justify-between gap-2'>
              <Badge variant='secondary' className='inline-flex px-3 py-0.5'>
                <p className='text-sm'>{cardDetail!.list.name}</p>
              </Badge>
              <div className='flex items-center gap-2'>
                <UploadFilesWrapper
                  onSuccess={onSuccessUploadBackground}
                  disabled={updateCardBackgroundAction.isPending}
                  allowedTypes={FILE_TYPE_GROUPS.IMAGES}
                  className='rounded-full'
                  variant='ghost'
                  size='icon'
                >
                  <ImageIcon className='size-4.5' />
                </UploadFilesWrapper>
                <Button className='rounded-full' variant='ghost' size='icon'>
                  <MoreHorizontal className='size-4.5' />
                </Button>
                <Button className='rounded-full' variant='ghost' size='icon' onClick={handleClose}>
                  <X className='size-5' />
                </Button>
              </div>
            </div>
          )}

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

                      {!hadCardDates ? (
                        <DatePopover
                          boardSlug={boardSlug}
                          cardSlug={cardDetail!.slug}
                          reminderType={cardDetail!.reminderType}
                          cardStartDate={cardDetail!.startDate}
                          cardEndDate={cardDetail!.endDate}
                        >
                          <Button variant='outline' size='sm'>
                            <Clock className='size-3.5' />
                            <p className='text-xs'>Ngày</p>
                          </Button>
                        </DatePopover>
                      ) : null}

                      <SubtaskPopover boardSlug={boardSlug} cardSlug={cardDetail!.slug} />

                      <AsigneePopover />

                      <Button variant='outline' size='sm'>
                        <Paperclip className='size-3.5' />
                        <p className='text-xs'>Đính kèm</p>
                      </Button>
                    </div>

                    {isDisplayRow ? (
                      <div className='flex items-center gap-8 flex-wrap mt-8'>
                        {hadCardLabels ? (
                          <div className='space-y-1'>
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

                        {hadCardDates ? (
                          <div className='space-y-1'>
                            <p className='text-xs font-semibold text-muted-foreground'>
                              {getCardDateLabel(cardDetail?.startDate, cardDetail?.endDate)}
                            </p>
                            <DatePopover
                              boardSlug={boardSlug}
                              cardSlug={cardDetail!.slug}
                              reminderType={cardDetail!.reminderType}
                              cardStartDate={cardDetail!.startDate}
                              cardEndDate={cardDetail!.endDate}
                            >
                              <Button variant='secondary' className='h-8 min-w-14 flex items-center gap-1 px-3'>
                                <p className='text-sm font-semibold'>{formatCardDate(cardDetail!.startDate)}</p>
                                {cardDetail!.startDate && cardDetail!.endDate ? '-' : null}
                                <p className='text-sm font-semibold'>{formatCardDateTime(cardDetail!.endDate)}</p>
                                <ChevronDown className='size-4 ml-1' />
                              </Button>
                            </DatePopover>
                          </div>
                        ) : null}
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

                {cardHasSubtasks ? (
                  <SubtaskSection
                    subtasks={cardDetail!.subtasks}
                    boardSlug={boardSlug}
                    cardSlug={cardDetail!.slug}
                    openParentId={openParentId}
                    setOpenParentId={setOpenParentId}
                  />
                ) : null}
              </div>

              <div className='col-span-5 p-6 bg-muted rounded-br-md pb-12 overflow-auto max-h-[calc(100vh-7rem)]'>
                <div className='flex items-center gap-2 mb-4'>
                  <MessageSquareText className='size-4' />
                  <p className='text-sm font-bold'>Nhận xét và hoạt động</p>
                </div>

                <Input
                  placeholder='Viết bình luận...'
                  className='font-semibold bg-background'
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleCreateCommment()
                    }
                  }}
                />

                <div className='space-y-4 mt-4'>
                  {timelines?.sortedList.map((timeline) => {
                    return <Timeline key={timeline.id} timeline={timeline} />
                  })}
                </div>
              </div>
            </div>
          </div>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
