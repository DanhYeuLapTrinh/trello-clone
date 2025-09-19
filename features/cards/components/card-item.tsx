'use client'

import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import { CardPreview } from '@/types/common'
import { CircleCheckBig, LucideIcon, MessageSquare, Paperclip, SquarePen, TextAlignStart } from 'lucide-react'
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

  const isDisplayIcon = card._count.comments > 0 || card._count.attachments > 0

  const handleCardClick = () => {
    if (slug) {
      router.push(`/b/${slug}/c/${card.slug}`)
    }
  }

  return (
    <Card
      className='px-3 py-2 rounded-md hover:cursor-pointer hover:ring-2 hover:ring-primary relative'
      onMouseEnter={toggleHovering}
      onMouseLeave={toggleHovering}
      onClick={handleCardClick}
    >
      {isHovering ? <SquarePen className='size-3.5 absolute right-2 top-2' /> : null}

      {card.cardLabels && Array.isArray(card.cardLabels) && card.cardLabels.length > 0 && (
        <div className='flex flex-row items-start gap-2 flex-wrap'>
          {card.cardLabels.map((label) => (
            <div className={cn('w-10 h-2 rounded-full', label)} key={label.id} />
          ))}
        </div>
      )}

      <div className='flex flex-row items-start gap-2'>
        {isHovering ? <Checkbox className='rounded-full border-foreground mt-0.5' /> : null}
        <p className='text-sm w-[85%]'>{card.title}</p>
      </div>

      {isDisplayIcon ? (
        <div className='flex flex-row items-center gap-2 flex-wrap'>
          {card.description ? <PreviewIcon icon={TextAlignStart} /> : null}

          {card._count.comments > 0 ? (
            <PreviewIcon icon={MessageSquare} count={card._count.comments} label='Comments' />
          ) : null}

          {card._count.attachments > 0 ? (
            <PreviewIcon icon={Paperclip} count={card._count.comments} label='Comments' />
          ) : null}

          {card.subtasks.length > 0 ? (
            <PreviewIcon icon={CircleCheckBig} count={card.subtasks.length} label='Subtasks' />
          ) : null}
        </div>
      ) : null}
    </Card>
  )
}

const PreviewIcon = ({ icon, count, label }: { icon: LucideIcon; count?: number; label?: string }) => {
  return (
    <div className='flex flex-row items-center gap-2'>
      {createElement(icon, { className: 'size-3.5' })}
      {count ? <span className='text-sm'>{count}</span> : null}
      {label ? <span className='text-sm'>{label}</span> : null}
    </div>
  )
}
