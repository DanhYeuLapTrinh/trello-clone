import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { CreateDetails, MoveDetails, TimelineItemType } from '@/types/common'
import { Activity, User } from '@prisma/client'
import { formatDateRelativeVN } from '../utils'

interface ActivityCardProps {
  activity: Activity & { user: User } & { __type: TimelineItemType.Activity }
}

const getActivityLabel = (activity: Activity & { user: User } & { __type: TimelineItemType.Activity }) => {
  if (activity.model === 'CARD') {
    let details
    switch (activity.action) {
      case 'CREATE':
        details = activity.details as unknown as CreateDetails
        return `đã thêm thẻ này vào danh sách ${details.nameSnapshot}`
      case 'MOVE':
        details = activity.details as unknown as MoveDetails
        return `đã di chuyển thẻ này từ danh sách ${details.fromListName} tới danh sách ${details.toListName}`
    }
  }
}

export default function ActivityCard({ activity }: ActivityCardProps) {
  return (
    <div className='flex items-start gap-2'>
      <Avatar>
        <AvatarImage className='size-8' src={activity.user.imageUrl || undefined} />
        <AvatarFallback>
          {activity.user.firstName?.[0] ?? ''}
          {activity.user.lastName?.[0] ?? ''}
        </AvatarFallback>
      </Avatar>
      <div className='space-y-1'>
        <p className='text-sm font-bold'>
          {activity.user.firstName} {activity.user.lastName}{' '}
          <span className='text-sm font-normal'>{getActivityLabel(activity)}</span>
        </p>
        <p className='text-xs text-primary underline'>{formatDateRelativeVN(activity.createdAt)}</p>
      </div>
    </div>
  )
}
