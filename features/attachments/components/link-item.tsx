import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Attachment } from '@prisma/client'
import { LinkIcon, MoreHorizontal } from 'lucide-react'
import Link from 'next/link'
import AttachmentActions from './attachment-actions'

interface LinkItemProps {
  attachment: Attachment
  boardSlug: string
  cardSlug: string
}

export default function LinkItem({ attachment, boardSlug, cardSlug }: LinkItemProps) {
  return (
    <Card className='flex flex-row py-2 pr-2 pl-3 rounded-md'>
      <div className='flex items-center gap-3 flex-1'>
        <LinkIcon className='size-4' />
        <Link href={attachment.url} target='_blank'>
          <p className='text-sm text-primary underline flex-1'>{attachment.fileName}</p>
        </Link>
      </div>

      <AttachmentActions boardSlug={boardSlug} cardSlug={cardSlug} attachment={attachment}>
        <Button variant='secondary' size='icon' className='size-7'>
          <MoreHorizontal className='size-4' />
        </Button>
      </AttachmentActions>
    </Card>
  )
}
