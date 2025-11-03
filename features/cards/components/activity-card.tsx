import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { UIActivity } from '@/prisma/queries/activity'
import { UIUser } from '@/prisma/queries/user'
import { AssigneeDetails, CreateDetails, MoveDetails, TimelineItemType } from '@/shared/types'
import { formatDateRelativeVN } from '../utils'

interface ActivityCardProps {
  activity: UIActivity & { user: UIUser } & { __type: TimelineItemType.Activity }
}

const getActivityLabel = (activity: UIActivity & { user: UIUser } & { __type: TimelineItemType.Activity }) => {
  if (activity.model === 'CARD') {
    let details
    switch (activity.action) {
      case 'CREATE':
        details = activity.details as unknown as CreateDetails
        return <span className='text-sm font-normal'>đã thêm thẻ này vào danh sách {details.nameSnapshot}</span>

      case 'ASSIGN_MEMBER':
        details = activity.details as unknown as AssigneeDetails
        if (details.targetId === details.actorId) {
          return <span className='text-sm font-normal'>đã tham gia thẻ này</span>
        }

        return (
          <span className='text-sm font-normal'>
            đã thêm <b>{details.targetName}</b> vào thẻ này
          </span>
        )

      case 'UNASSIGN_MEMBER':
        details = activity.details as unknown as AssigneeDetails
        if (details.targetId === details.actorId) {
          return <span className='text-sm font-normal'>đã rời khỏi thẻ này</span>
        }

        return (
          <span className='text-sm font-normal'>
            đã loại <b>{details.targetName}</b> khỏi thẻ này
          </span>
        )

      case 'MOVE':
        details = activity.details as unknown as MoveDetails
        return (
          <span className='text-sm font-normal'>
            đã di chuyển thẻ này từ danh sách {details.fromListName} tới danh sách {details.toListName}
          </span>
        )
    }
  }
}

export default function ActivityCard({ activity }: ActivityCardProps) {
  return (
    <div className='flex items-start gap-2'>
      <Avatar>
        <AvatarImage className='size-8' src={activity.user.imageUrl || undefined} />
        <AvatarFallback>{activity.user.fullName?.[0] ?? ''}</AvatarFallback>
      </Avatar>

      <div className='space-y-1'>
        <p className='text-sm font-bold'>
          {activity.user.fullName} {getActivityLabel(activity)}
        </p>
        <p className='text-xs text-primary underline'>{formatDateRelativeVN(activity.createdAt)}</p>
      </div>
    </div>
  )
}
