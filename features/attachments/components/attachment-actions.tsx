'use client'

import { Button } from '@/components/ui/button'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Attachment } from '@prisma/client'
import { useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, X } from 'lucide-react'
import { useState } from 'react'
import { SubmitHandler } from 'react-hook-form'
import { useDeleteAttachment } from '../hooks/use-delete-attachment'
import { useUpdateAttachment } from '../hooks/use-update-attachment'
import { deleteAttachmentQueries, updateAttachmentQueries } from '../utils'
import { UpdateAttachmentSchema } from '../validations'

interface AttachmentActionsProps {
  boardSlug: string
  cardSlug: string
  attachment: Attachment
  children: React.ReactNode
}

export default function AttachmentActions({ children, boardSlug, cardSlug, attachment }: AttachmentActionsProps) {
  const queryClient = useQueryClient()

  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<'delete' | 'update' | 'view'>('view')

  const { deleteAttachmentAction } = useDeleteAttachment(boardSlug, cardSlug)

  const { methods, updateAttachmentAction } = useUpdateAttachment({
    boardSlug,
    cardSlug,
    attachmentId: attachment.id,
    url: attachment.url,
    fileName: attachment.fileName || '',
    fileType: attachment.fileType
  })

  const { control, handleSubmit } = methods

  const handleDelete = () => {
    setOpen(false)
    setMode('view')

    deleteAttachmentQueries({
      queryClient,
      boardSlug,
      cardSlug,
      attachmentId: attachment.id
    })

    deleteAttachmentAction.execute({
      boardSlug,
      cardSlug,
      attachmentId: attachment.id,
      url: attachment.url,
      fileType: attachment.fileType
    })
  }

  const handleClose = () => {
    setOpen(false)
    setTimeout(() => {
      setMode('view')
    }, 100)
  }

  const onSubmit: SubmitHandler<UpdateAttachmentSchema> = (data) => {
    setOpen(false)
    setMode('view')
    updateAttachmentQueries({
      queryClient,
      ...data
    })
    updateAttachmentAction.execute(data)
  }

  const renderContent = () => {
    if (mode === 'view') {
      return (
        <div className='w-56 space-y-2 px-0 py-3'>
          <Button
            className='w-full rounded-none justify-start'
            variant='ghost'
            size='sm'
            onClick={() => setMode('update')}
          >
            <p className='font-normal'>Sửa</p>
          </Button>
          <Button
            className='w-full rounded-none justify-start'
            variant='ghost'
            size='sm'
            onClick={() => setMode('delete')}
          >
            <p className='text-rose-500 font-normal'>Loại bỏ</p>
          </Button>
        </div>
      )
    }

    if (mode === 'update') {
      return (
        <div className='w-80'>
          <div className='flex items-center w-full p-2'>
            <div className='flex-1 flex justify-start'>
              <Button variant='ghost' size='icon' onClick={() => setMode('view')}>
                <ChevronLeft className='size-4' />
              </Button>
            </div>
            <p className='font-semibold text-sm text-center text-muted-foreground'>Sửa tệp đính kèm</p>
            <div className='flex-1 flex justify-end'>
              <Button variant='ghost' size='icon' onClick={handleClose}>
                <X className='size-4' />
              </Button>
            </div>
          </div>

          <div className='p-3'>
            <div className='space-y-4'>
              <Form {...methods}>
                {attachment.fileType === 'href' ? (
                  <FormField
                    control={control}
                    name='url'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className='font-semibold'>Dán liên kết</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : null}

                <FormField
                  control={control}
                  name='fileName'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='font-semibold'>
                        {attachment.fileType === 'href' ? 'Văn bản hiển thị (không bắt buộc)' : 'Tên tệp'}
                      </FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      {attachment.fileType === 'href' ? (
                        <FormDescription className='text-xs'>
                          Cung cấp tiêu đề hoặc mô tả cho liên kết này
                        </FormDescription>
                      ) : null}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </Form>
            </div>

            <div className='flex items-center justify-end gap-2 mt-6'>
              <Button variant='secondary' onClick={() => setMode('view')}>
                Hủy
              </Button>
              <Button onClick={handleSubmit(onSubmit)}>Lưu</Button>
            </div>
          </div>
        </div>
      )
    }

    if (mode === 'delete') {
      return (
        <div className='w-80'>
          <div className='flex items-center p-2'>
            <div className='flex-1 justify-start'>
              <Button variant='ghost' size='icon' onClick={() => setMode('view')}>
                <ChevronLeft className='size-4' />
              </Button>
            </div>
            <p className='font-semibold text-sm text-center text-muted-foreground'>Loại bỏ tệp đính kèm?</p>
            <div className='flex-1 flex justify-end'>
              <Button variant='ghost' size='icon' onClick={handleClose}>
                <X className='size-4' />
              </Button>
            </div>
          </div>
          <div className='px-3 pb-3 space-y-2'>
            <p className='text-sm'>Loại bỏ tệp đính kèm này? Bạn không thể hoàn tác.</p>
            <Button className='w-full' variant='destructive' onClick={handleDelete}>
              Loại bỏ
            </Button>
          </div>
        </div>
      )
    }
  }

  return (
    <Popover
      open={open}
      onOpenChange={(open) => {
        setOpen(open)
        if (!open) {
          setTimeout(() => {
            setMode('view')
          }, 100)
        }
      }}
    >
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent side='bottom' align='start' className='p-0 w-auto'>
        {renderContent()}
      </PopoverContent>
    </Popover>
  )
}
