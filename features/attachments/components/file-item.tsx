import { Button, buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { formatDateRelativeVN } from '@/features/cards/utils'
import { FILE_TYPE_GROUPS, FILE_TYPE_LABEL } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { Attachment } from '@prisma/client'
import { ExternalLink, MoreHorizontal } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import AttachmentActions from './attachment-actions'

interface FileItemProps {
  attachment: Attachment
  boardSlug: string
  cardSlug: string
}

export default function FileItem({ attachment, boardSlug, cardSlug }: FileItemProps) {
  return (
    <div className='flex items-center gap-3 w-full'>
      <Card className='w-20 h-12 p-0 items-center justify-center rounded-md'>
        {FILE_TYPE_GROUPS.IMAGES.includes(attachment.fileType ?? 'unknown') ? (
          <div className='w-full h-full relative'>
            <Image className='object-cover rounded-md' fill src={attachment.url} alt={attachment.fileName ?? ''} />
          </div>
        ) : (
          <p className='font-bold underline text-foreground/70'>{FILE_TYPE_LABEL[attachment.fileType ?? 'unknown']}</p>
        )}
      </Card>

      <div className='flex-1'>
        <p className='text-sm font-medium'>{attachment.fileName}</p>
        <p className='text-xs text-muted-foreground'>Đã thêm {formatDateRelativeVN(attachment.createdAt)}</p>
      </div>

      <div className='space-x-2'>
        <Link
          className={cn('size-7', buttonVariants({ variant: 'secondary', size: 'icon', className: 'size-7' }))}
          href={attachment.url}
          target='_blank'
        >
          <ExternalLink className='size-4' />
        </Link>

        <AttachmentActions boardSlug={boardSlug} cardSlug={cardSlug} attachment={attachment}>
          <Button variant='secondary' size='icon' className='size-7'>
            <MoreHorizontal className='size-4' />
          </Button>
        </AttachmentActions>
      </div>
    </div>
  )
}
