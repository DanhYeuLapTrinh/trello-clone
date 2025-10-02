'use client'

import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import { CardPreview } from '@/types/common'
import { Clock, LucideIcon, MessageSquare, Paperclip, SquareCheckBig, SquarePen, TextAlignStart } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createElement } from 'react'
import { formatCardDateRange, getSubtaskStats, getVisibleCardLabels, shouldDisplayCardIcons } from '../utils'

interface CardItemProps {
  card: CardPreview
  slug?: string
}

export default function CardItem({ card, slug }: CardItemProps) {
  const router = useRouter()

  const isDisplayIcon = shouldDisplayCardIcons(card)
  const { doneSubtasks, totalSubtasks } = getSubtaskStats(card.subtasks)
  const visibleCardLabels = getVisibleCardLabels(card.cardLabels)

  const handleCardClick = () => {
    if (slug) {
      router.push(`/b/${slug}/c/${card.slug}`)
    }
  }

  return (
    <Card
      className='p-0 rounded-md hover:cursor-pointer hover:ring-2 hover:ring-primary group relative gap-0'
      onClick={handleCardClick}
    >
      {card.imageUrl ? (
        <div className='relative w-full h-36'>
          <Image
            src={card.imageUrl}
            alt={card.title}
            fill
            sizes='(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
            className='rounded-t-md object-cover'
          />
        </div>
      ) : null}

      <div className='space-y-2 p-3'>
        <SquarePen className='size-3.5 absolute right-2 top-2 hidden group-hover:block' />

        {visibleCardLabels.length > 0 && (
          <div className='flex items-start gap-1 flex-wrap'>
            {visibleCardLabels.map((cardLabel) => (
              <div className={cn('w-10 h-2 rounded-full', cardLabel.label.color)} key={cardLabel.id} />
            ))}
          </div>
        )}

        <div className='flex items-start gap-2'>
          <Checkbox className='rounded-full border-foreground mt-0.5 hidden group-hover:block' />
          <p className='text-sm w-[85%]'>{card.title}</p>
        </div>

        {isDisplayIcon ? (
          <div className='flex items-center gap-x-4 gap-y-2 flex-wrap'>
            {card.startDate || card.endDate ? (
              <PreviewIcon icon={Clock} label={formatCardDateRange(card.startDate, card.endDate)} />
            ) : null}
            {card.description ? <PreviewIcon icon={TextAlignStart} /> : null}
            {card._count.comments > 0 ? <PreviewIcon icon={MessageSquare} count={card._count.comments} /> : null}
            {card._count.attachments > 0 ? <PreviewIcon icon={Paperclip} count={card._count.attachments} /> : null}
            {card.subtasks.flatMap((subtask) => subtask.children).length > 0 ? (
              <PreviewIcon icon={SquareCheckBig} label={`${doneSubtasks}/${totalSubtasks}`} />
            ) : null}
          </div>
        ) : null}
      </div>
    </Card>
  )
}

const PreviewIcon = ({ icon, count, label }: { icon: LucideIcon; count?: number; label?: string }) => {
  return (
    <div className='flex items-center gap-1'>
      {createElement(icon, { className: 'size-3.5 stroke-[2.5] text-foreground/65' })}
      {count ? <span className='text-xs font-medium text-muted-foreground'>{count}</span> : null}
      {label ? <span className='text-xs font-medium text-muted-foreground'>{label}</span> : null}
    </div>
  )
}
