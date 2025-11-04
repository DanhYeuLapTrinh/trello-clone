'use client'

import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { CardPreview } from '@/prisma/queries/card'
import { ListWithCards } from '@/prisma/queries/list'
import { cn } from '@/shared/utils'
import { useQueryClient } from '@tanstack/react-query'
import {
  Clock,
  Eye,
  LucideIcon,
  MessageSquare,
  Paperclip,
  SquareCheckBig,
  SquarePen,
  TextAlignStart
} from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createElement } from 'react'
import { useToggleCompleteCard } from '../hooks/use-toggle-complete-card'
import {
  formatCardDateRange,
  getSubtaskStats,
  getVisibleCardLabels,
  isCardExpired,
  shouldDisplayCardIcons
} from '../utils'

interface CardItemProps {
  card: CardPreview
  slug: string
}

export default function CardItem({ card, slug }: CardItemProps) {
  const router = useRouter()
  const queryClient = useQueryClient()

  const { toggleCompleteCardAction } = useToggleCompleteCard(slug, card.slug)

  const isDisplayIcon = shouldDisplayCardIcons({
    _count: card._count,
    description: card.description,
    subtasks: card.subtasks,
    startDate: card.startDate,
    endDate: card.endDate,
    watchers: card.watchers
  })

  const { doneSubtasks, totalSubtasks } = getSubtaskStats(card.subtasks)
  const visibleCardLabels = getVisibleCardLabels(card.cardLabels)
  const isWatching = card.watchers.length > 0

  const handleCardClick = () => {
    router.push(`/b/${slug}/c/${card.slug}`)
  }

  const handleToggleCompleteCard = () => {
    queryClient.setQueryData(['board', 'lists', 'cards', slug], (oldData: ListWithCards[]) => {
      return oldData.map((list) => ({
        ...list,
        cards: list.cards.map((c) => (c.id === card.id ? { ...c, isCompleted: !c.isCompleted } : c))
      }))
    })

    toggleCompleteCardAction.execute({ cardSlug: card.slug, boardSlug: slug })
  }

  return (
    <Card
      className='p-0 rounded-md hover:cursor-pointer hover:ring-2 hover:ring-primary group relative gap-0 mr-1'
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
          <Checkbox
            className={cn(
              'rounded-full border-foreground mt-0.5',
              card.isCompleted
                ? 'data-[state=checked]:bg-lime-600 data-[state=checked]:border-lime-600'
                : 'hidden group-hover:block'
            )}
            checked={card.isCompleted}
            onCheckedChange={handleToggleCompleteCard}
            onClick={(e) => e.stopPropagation()}
          />
          <p className={cn('text-sm w-[85%]', card.isCompleted ? 'text-muted-foreground' : '')}>{card.title}</p>
        </div>

        {isDisplayIcon ? (
          <div className='flex items-center gap-x-2 gap-y-1 flex-wrap'>
            {isWatching ? <PreviewIcon icon={Eye} /> : null}
            {card.startDate || card.endDate ? (
              <PreviewIcon
                icon={Clock}
                label={formatCardDateRange(card.startDate, card.endDate)}
                className={isCardExpired(card.endDate) ? 'text-rose-700' : ''}
                containerClassName={isCardExpired(card.endDate) ? 'bg-rose-200 px-2' : ''}
                iconClassName={isCardExpired(card.endDate) ? 'text-rose-700' : ''}
              />
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

const PreviewIcon = ({
  icon,
  count,
  label,
  className,
  containerClassName,
  iconClassName
}: {
  icon: LucideIcon
  count?: number
  label?: string
  className?: string
  containerClassName?: string
  iconClassName?: string
}) => {
  return (
    <div className={cn('flex items-center gap-1 p-1 rounded-sm', containerClassName)}>
      {createElement(icon, { className: cn('size-3.5 stroke-[2.5] text-foreground/65', iconClassName) })}
      {count ? <span className={cn('text-xs font-medium text-muted-foreground', className)}>{count}</span> : null}
      {label ? <span className={cn('text-xs font-medium text-muted-foreground', className)}>{label}</span> : null}
    </div>
  )
}
