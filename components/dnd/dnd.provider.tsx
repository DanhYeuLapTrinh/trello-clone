'use client'

import { DndContext, DragEndEvent, DragOverEvent, DragStartEvent } from '@dnd-kit/core'

interface DndProviderProps {
  children: React.ReactNode
  onDragStart?: (event: DragStartEvent) => void
  onDragOver?: (event: DragOverEvent) => void
  onDragEnd?: (event: DragEndEvent) => void
}

export default function DndProvider({ children, onDragStart, onDragOver, onDragEnd }: DndProviderProps) {
  return (
    <DndContext onDragStart={onDragStart} onDragOver={onDragOver} onDragEnd={onDragEnd}>
      {children}
    </DndContext>
  )
}
