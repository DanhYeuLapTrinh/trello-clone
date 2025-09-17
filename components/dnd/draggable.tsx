'use client'

import { cn } from '@/lib/utils'
import { useDraggable } from '@dnd-kit/core'

interface DraggableProps {
  children: React.ReactNode
  id: string
  data: Record<string, string>
  className?: string
}

export default function Draggable({ children, id, data, className }: DraggableProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id,
    data
  })
  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`
      }
    : undefined

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes} className={cn('w-full', className)}>
      {children}
    </div>
  )
}
