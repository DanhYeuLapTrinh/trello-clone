import { Button } from '@/components/ui/button'
import { UIAttachment } from '@/prisma/queries/attachment'
import { Paperclip } from 'lucide-react'
import AttachmentPopover from './attachment-popover'
import FileItem from './file-item'
import LinkItem from './link-item'

interface AttachmentSectionProps {
  attachments: UIAttachment[]
  cardSlug: string
  boardSlug: string
}

export default function AttachmentSection({ attachments, cardSlug, boardSlug }: AttachmentSectionProps) {
  const files = attachments.filter((attachment) => attachment.fileType !== 'href')
  const hrefs = attachments.filter((attachment) => attachment.fileType === 'href')

  return (
    <div className='flex items-start gap-3 mt-8 mb-12'>
      <Paperclip className='size-5 stroke-[2.5] mt-1.5' />
      <div className='space-y-2 w-full'>
        <div className='flex items-center'>
          <p className='text-sm font-bold flex-1'>Các tập tin đính kèm</p>
          <AttachmentPopover cardSlug={cardSlug} boardSlug={boardSlug}>
            <Button size='sm' variant='secondary'>
              Thêm
            </Button>
          </AttachmentPopover>
        </div>

        {hrefs.length > 0 && (
          <div className='space-y-2 mt-4'>
            <p className='text-xs font-semibold text-foreground/70'>Liên kết</p>

            {hrefs.map((attachment) => (
              <LinkItem key={attachment.id} attachment={attachment} boardSlug={boardSlug} cardSlug={cardSlug} />
            ))}
          </div>
        )}

        {files.length > 0 && (
          <div className='space-y-2 mt-4'>
            <p className='text-xs font-semibold text-foreground/70'>Tệp</p>

            {files.map((attachment) => (
              <FileItem key={attachment.id} attachment={attachment} boardSlug={boardSlug} cardSlug={cardSlug} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
