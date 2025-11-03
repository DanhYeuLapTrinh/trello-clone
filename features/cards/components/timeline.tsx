import CommentCard from '@/features/comments/components/comment-card'
import ActivityCard from './activity-card'
import { TimelineItem, TimelineItemType } from '@/shared/types'

interface TimelineProps {
  timeline: TimelineItem
}

export default function Timeline({ timeline }: TimelineProps) {
  if (timeline.__type === TimelineItemType.Activity) {
    return <ActivityCard activity={timeline} />
  } else {
    return <CommentCard comment={timeline} />
  }
}
