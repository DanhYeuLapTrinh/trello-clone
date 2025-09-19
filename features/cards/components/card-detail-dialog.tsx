'use client'

import Editor from '@/components/editor'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { CardDetail } from '@/types/common'
import {
  CircleCheckBig,
  Clock,
  ImageIcon,
  MessageSquareText,
  MoreHorizontal,
  Paperclip,
  Tag,
  TextAlignStart,
  UserRoundPlus,
  X
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface CardDetailDialogProps {
  children?: React.ReactNode
  isOpen: boolean
  cardDetail: CardDetail
}

export default function CardDetailDialog({ children, isOpen, cardDetail }: CardDetailDialogProps) {
  const router = useRouter()
  const [internalOpen, setInternalOpen] = useState(isOpen)
  const [isDisplay, setIsDisplay] = useState(false)

  const handleClose = () => {
    setInternalOpen(false)
    router.back()
  }

  const toggleDisplay = () => {
    setIsDisplay((prev) => !prev)
  }

  return (
    <Dialog open={internalOpen} onOpenChange={handleClose}>
      {children && <DialogTrigger className='w-full text-left'>{children}</DialogTrigger>}

      <DialogContent
        showCloseButton={false}
        className='p-0 gap-0'
        position='tc'
        size='xxl'
        aria-describedby='card-detail-dialog'
      >
        <div className='px-6 py-3 flex items-center justify-between gap-2'>
          <Badge variant='secondary' className='inline-flex px-3 py-0.5'>
            <p className='text-sm'>{cardDetail.list.name}</p>
          </Badge>
          <div className='flex items-center gap-2'>
            <Button className='rounded-full' variant='ghost' size='icon'>
              <ImageIcon className='size-5' />
            </Button>
            <Button className='rounded-full' variant='ghost' size='icon'>
              <MoreHorizontal className='size-5' />
            </Button>
            <Button className='rounded-full' variant='ghost' size='icon' onClick={handleClose}>
              <X className='size-5' />
            </Button>
          </div>
        </div>

        <Separator />

        <div className='grid grid-cols-12'>
          <div className='col-span-7 p-6 border-r border-border'>
            <div className='flex  items-start gap-3'>
              <Checkbox className='rounded-full border-foreground mt-2' />
              <div className='space-y-6'>
                <p className='text-2xl font-bold'>{cardDetail.title}</p>
                <div className='flex items-center gap-2 flex-wrap'>
                  <Button variant='outline' size='sm'>
                    <Tag className='size-3.5' />
                    <p className='text-xs'>Nhãn</p>
                  </Button>
                  <Button variant='outline' size='sm'>
                    <Clock className='size-3.5' />
                    <p className='text-xs'>Ngày</p>
                  </Button>
                  <Button variant='outline' size='sm'>
                    <CircleCheckBig className='size-3.5' />
                    <p className='text-xs'>Việc cần làm</p>
                  </Button>
                  <Button variant='outline' size='sm'>
                    <UserRoundPlus className='size-3.5' />
                    <p className='text-xs'>Thành viên</p>
                  </Button>
                  <Button variant='outline' size='sm'>
                    <Paperclip className='size-3.5' />
                    <p className='text-xs'>Đính kèm</p>
                  </Button>
                </div>
              </div>
            </div>
            <div className='flex  items-start gap-3 mt-8 mb-6'>
              <TextAlignStart className='size-4 mt-0.5' />
              <div className='space-y-4 w-full'>
                <p className='text-sm font-semibold'>Mô tả</p>
                {!isDisplay ? (
                  <Textarea
                    onFocus={toggleDisplay}
                    placeholder='Thêm mô tả chi tiết hơn...'
                    className='resize-none w-full font-semibold'
                  />
                ) : null}

                <Editor isDisplay={isDisplay} onSave={() => {}} onCancel={toggleDisplay} />
              </div>
            </div>
          </div>

          <div className='col-span-5 p-6 bg-muted rounded-br-md'>
            <div className='flex items-center gap-2 mb-4'>
              <MessageSquareText className='size-4' />
              <p className='text-sm font-semibold'>Nhận xét và hoạt động</p>
            </div>

            <Input placeholder='Viết bình luận...' className='font-semibold bg-background' />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
