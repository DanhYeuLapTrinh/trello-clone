import { TimelineItemType } from '@/types/common'
import { Comment, User } from '@prisma/client'

interface CommentCardProps {
  comment: Comment & { user: User } & { __type: TimelineItemType.Comment }
}

export default function CommentCard({ comment }: CommentCardProps) {
  return <div>{comment.content}</div>
}
