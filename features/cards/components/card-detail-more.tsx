'use client'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { useMe } from '@/hooks/use-me'
import { useQueryClient } from '@tanstack/react-query'
import { Archive, Check, Eye, Share2 } from 'lucide-react'
import { useState } from 'react'
import { useToggleWatchCard } from '../hooks/use-toggle-watch-card'
import { toggleWatchCardQueries } from '../utils'

interface CardDetailMoreProps {
  boardSlug: string
  cardSlug: string
  children: React.ReactNode
  isWatching: boolean
}

export default function CardDetailMore({ children, isWatching, boardSlug, cardSlug }: CardDetailMoreProps) {
  const queryClient = useQueryClient()
  const { data: user } = useMe()
  const [open, setOpen] = useState(false)
  const { toggleWatchCardAction } = useToggleWatchCard(boardSlug, cardSlug)

  const handleWatchCard = () => {
    toggleWatchCardQueries({ queryClient, boardSlug, cardSlug, isWatching, userId: user?.id || '' })
    toggleWatchCardAction.execute({ boardSlug, cardSlug })
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent className='w-52'>
        <DropdownMenuItem
          className='flex items-center gap-2.5'
          onClick={handleWatchCard}
          onSelect={(e) => e.preventDefault()}
        >
          <Eye className='text-foreground' />
          <p className='flex-1'>Theo dõi</p>
          {isWatching ? (
            <div className='bg-emerald-600 p-1 rounded-sm'>
              <Check className='text-white size-3' />
            </div>
          ) : null}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className='flex items-center gap-2.5'>
          <Share2 className='text-foreground' />
          <p>Chia sẻ</p>
        </DropdownMenuItem>
        <DropdownMenuItem className='flex items-center gap-2.5'>
          <Archive className='text-foreground' />
          <p>Lưu trữ</p>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
