import CommentCard from '@/features/comments/components/comment-card'
import { TimelineItem, TimelineItemType } from '@/types/common'
import ActivityCard from './activity-card'

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
