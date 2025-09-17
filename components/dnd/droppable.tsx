'use client'

import { cn } from '@/lib/utils'
import { useDroppable } from '@dnd-kit/core'

interface DroppableProps {
  children: React.ReactNode
  id: string
  className?: string
  data: Record<string, string>
}

export default function Droppable({ children, id, className, data }: DroppableProps) {
  const { setNodeRef } = useDroppable({
    id,
    data
  })

  return (
    <div className={cn('w-full', className)} ref={setNodeRef}>
      {children}
    </div>
  )
}
