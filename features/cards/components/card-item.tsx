'use client'

import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import { CardPreview } from '@/types/common'
import { LucideIcon, MessageSquare, Paperclip, SquareCheckBig, SquarePen, TextAlignStart } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createElement, useState } from 'react'

interface CardItemProps {
  card: CardPreview
  slug?: string
}

export default function CardItem({ card, slug }: CardItemProps) {
  const [isHovering, setIsHovering] = useState(false)
  const router = useRouter()

  const toggleHovering = () => {
    setIsHovering((prev) => !prev)
  }

  const isDisplayIcon =
    card._count.comments > 0 || card._count.attachments > 0 || card.description || card.subtasks.length > 0

  const doneSubtasks = card.subtasks.reduce(
    (acc, subtask) => acc + subtask.children.filter((child) => child.isDone).length,
    0
  )
  const totalSubtasks = card.subtasks.reduce((acc, subtask) => acc + subtask.children.length, 0)

  const handleCardClick = () => {
    if (slug) {
      router.push(`/b/${slug}/c/${card.slug}`)
    }
  }

  return (
    <Card
      className='p-3 rounded-md hover:cursor-pointer hover:ring-2 hover:ring-primary relative gap-2'
      onMouseEnter={toggleHovering}
      onMouseLeave={toggleHovering}
      onClick={handleCardClick}
    >
      {isHovering ? <SquarePen className='size-3.5 absolute right-2 top-2' /> : null}

      {card.cardLabels && Array.isArray(card.cardLabels) && card.cardLabels.filter((l) => l.label.color).length > 0 && (
        <div className='flex items-start gap-1 flex-wrap'>
          {card.cardLabels
            .filter((l) => l.label.color)
            .map((cardLabel) => (
              <div className={cn('w-10 h-2 rounded-full', cardLabel.label.color)} key={cardLabel.id} />
            ))}
        </div>
      )}

      <div className='flex items-start gap-2'>
        {isHovering ? <Checkbox className='rounded-full border-foreground mt-0.5' /> : null}
        <p className='text-sm w-[85%]'>{card.title}</p>
      </div>

      {isDisplayIcon ? (
        <div className='flex items-center gap-4 flex-wrap'>
          {card.description ? <PreviewIcon icon={TextAlignStart} /> : null}

          {card._count.comments > 0 ? <PreviewIcon icon={MessageSquare} count={card._count.comments} /> : null}

          {card._count.attachments > 0 ? <PreviewIcon icon={Paperclip} count={card._count.attachments} /> : null}

          {card.subtasks.length > 0 ? (
            <PreviewIcon icon={SquareCheckBig} label={`${doneSubtasks}/${totalSubtasks}`} />
          ) : null}
        </div>
      ) : null}
    </Card>
  )
}

const PreviewIcon = ({ icon, count, label }: { icon: LucideIcon; count?: number; label?: string }) => {
  return (
    <div className='flex items-center gap-1'>
      {createElement(icon, { className: 'size-3.5 stroke-[2.5]' })}
      {count ? <span className='text-sm'>{count}</span> : null}
      {label ? <span className='text-xs font-medium text-muted-foreground'>{label}</span> : null}
    </div>
  )
}
