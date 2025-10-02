'use client'

import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import UploadFilesWrapper from '@/components/upload-files-wrapper'
import { FILE_FOLDER } from '@/lib/constants'
import { FileInfo } from '@/types/common'
import { useQueryClient } from '@tanstack/react-query'
import { X } from 'lucide-react'
import { useState } from 'react'
import { SubmitHandler } from 'react-hook-form'
import { useAddAttachment } from '../hooks/use-add-attachment'
import { addAttachmentQueries } from '../utils'
import { AddAttachmentSchema } from '../validations'

interface AttachmentPopoverProps {
  children: React.ReactNode
  cardSlug: string
  boardSlug: string
}

export default function AttachmentPopover({ children, cardSlug, boardSlug }: AttachmentPopoverProps) {
  const queryClient = useQueryClient()

  const [open, setOpen] = useState(false)

  const { methods, addAttachmentAction } = useAddAttachment(cardSlug, boardSlug)

  const { control, handleSubmit } = methods

  const onSubmit: SubmitHandler<AddAttachmentSchema> = (data) => {
    setOpen(false)
    addAttachmentQueries({
      queryClient,
      ...data
    })

    addAttachmentAction.execute(data)
  }

  const onCancel = () => {
    setOpen(false)
    methods.reset()
  }

  const onSuccessUploadFiles = (files: FileInfo[]) => {
    const attachmentData: AddAttachmentSchema = {
      fileName: files[0].name,
      fileType: files[0].type,
      url: files[0].url,
      cardSlug,
      boardSlug
    }

    addAttachmentQueries({
      queryClient,
      ...attachmentData
    })

    onCancel()
    addAttachmentAction.execute(attachmentData)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent side='bottom' align='start' className='p-0 w-80 flex flex-col gap-3'>
        <div className='flex items-center w-full p-2'>
          <div className='flex-1' />

          <p className='font-semibold text-sm text-center text-muted-foreground'>Đính kèm</p>
          <div className='flex-1 flex justify-end'>
            <Button variant='ghost' size='icon' onClick={() => setOpen(false)}>
              <X className='size-4' />
            </Button>
          </div>
        </div>

        <div className='px-3 pb-3 flex flex-col gap-3'>
          <div className='space-y-1'>
            <p className='text-sm font-semibold'>Đính kèm tệp từ máy tính của bạn</p>
            <p className='text-xs text-muted-foreground'>Bạn cũng có thể kéo và thả tệp để tải chúng lên</p>
          </div>

          <UploadFilesWrapper variant='secondary' onSuccess={onSuccessUploadFiles} folder={FILE_FOLDER.ATTACHMENTS}>
            Chọn tệp
          </UploadFilesWrapper>

          <Separator className='my-2' />

          <Form {...methods}>
            <FormField
              control={control}
              name='url'
              render={({ field }) => (
                <FormItem className='gap-1.5'>
                  <FormLabel className='font-semibold'>Dán liên kết</FormLabel>
                  <FormControl>
                    <Input placeholder='Nhập liên kết' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name='fileName'
              render={({ field }) => (
                <FormItem className='gap-1.5'>
                  <FormLabel className='font-semibold'>Văn bản hiển thị (không bắt buộc)</FormLabel>
                  <FormControl>
                    <Input placeholder='Văn bản cần hiển thị' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className='flex items-center justify-end gap-2 mt-4'>
              <Button variant='ghost' onClick={onCancel}>
                Hủy
              </Button>
              <Button onClick={handleSubmit(onSubmit)}>Chèn</Button>
            </div>
          </Form>
        </div>
      </PopoverContent>
    </Popover>
  )
}
