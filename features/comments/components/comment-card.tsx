import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card } from '@/components/ui/card'
import { formatDateRelativeVN } from '@/features/cards/utils'
import { UIComment } from '@/prisma/queries/comment'
import { UIUser } from '@/prisma/queries/user'
import { TimelineItemType } from '@/shared/types'
import { SmilePlus } from 'lucide-react'

interface CommentCardProps {
  comment: UIComment & { user: UIUser } & { __type: TimelineItemType.Comment }
}

export default function CommentCard({ comment }: CommentCardProps) {
  return (
    <div className='flex items-start gap-2 w-full'>
      <Avatar>
        <AvatarImage className='size-8' src={comment.user.imageUrl || undefined} />
        <AvatarFallback>{comment.user.fullName?.[0] ?? ''}</AvatarFallback>
      </Avatar>
      <div className='flex flex-col gap-1 w-full'>
        <p className='text-sm font-bold'>
          {comment.user.fullName}
          <span className='text-xs font-normal text-primary underline ml-1.5'>
            {formatDateRelativeVN(comment.createdAt)}
          </span>
        </p>

        <Card className='w-full p-3 rounded-md'>
          <p className='text-sm'>{comment.content}</p>
        </Card>

        <div className='flex items-center gap-1.5 mt-0.5'>
          <SmilePlus className='size-3.5 text-muted-foreground' />
          <div className='size-[3] rounded-full bg-muted-foreground' />
          <p className='text-xs underline text-muted-foreground'>Chỉnh sửa</p>
          <div className='size-[3] rounded-full bg-muted-foreground' />
          <p className='text-xs underline text-muted-foreground'>Xóa</p>
        </div>
      </div>
    </div>
  )
}
