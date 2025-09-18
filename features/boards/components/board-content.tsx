'use client'

import { moveCardWithinList } from '@/features/cards/actions'
import CardItem from '@/features/cards/components/card-item'
import CreateListButton from '@/features/lists/components/create-list-button'
import ListItem from '@/features/lists/components/list-item'
import { cn } from '@/lib/utils'
import { ListWithCards } from '@/types/common'
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  rectIntersection,
  useDroppable,
  useSensor,
  useSensors
} from '@dnd-kit/core'
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { Card } from '@prisma/client'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAction } from 'next-safe-action/hooks'
import { useState } from 'react'
import { getBoardListsWithCards } from '../actions'

interface BoardContentProps {
  boardId: string
  slug: string
}

export default function BoardContent({ boardId, slug }: BoardContentProps) {
  const queryClient = useQueryClient()
  const { data: lists } = useQuery({
    queryKey: ['board', 'lists', slug],
    queryFn: () => getBoardListsWithCards(slug)
  })

  const [activeCard, setActiveCard] = useState<Card | null>(null)

  const { execute: moveCardWithinListAction } = useAction(moveCardWithinList, {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', 'lists', slug] })
    },
    onError: (err) => {
      console.error('Failed to move card:', err)
    }
  })

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    const card = lists?.flatMap((list) => list.cards).find((card) => card.id === event.active.id)
    setActiveCard(card ?? null)
  }

  const handleDragOver = ({ active, over }: DragOverEvent) => {
    console.log('Drag over: ', { active, over })
    if (!over) return
  }

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    console.log('Drag ended: ', { active, over })
    if (!over) return

    const activeId = active.id
    const overId = over.id

    const activeList = lists?.find((list) => list.cards.some((card) => card.id === activeId))
    const overList = lists?.find((list) => list.cards.some((card) => card.id === overId))

    if (activeList && overList) {
      if (activeList.id === overList.id) {
        console.log('Move card within list')
        const activeIndex = activeList.cards.findIndex((card) => card.id === activeId)
        const overIndex = activeList.cards.findIndex((card) => card.id === overId)

        if (activeIndex !== overIndex) {
          queryClient.setQueryData(['board', 'lists', slug], (oldLists: ListWithCards[]) => {
            if (!oldLists) return oldLists

            const newLists = [...oldLists]
            const listIndex = newLists.findIndex((list) => list.id === activeList.id)
            const listToUpdate = newLists[listIndex]

            listToUpdate.cards = arrayMove(listToUpdate.cards, activeIndex, overIndex)
            newLists[listIndex] = listToUpdate

            return newLists
          })

          moveCardWithinListAction({
            cardId: activeId as string,
            listId: activeList.id,
            newPosition: overIndex,
            slug
          })
        }
      } else {
        console.log('Move card to another list')
      }
    } else if (activeList && !overList) {
      console.log('Move card to empty list')
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={rectIntersection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className='flex-1 p-3 overflow-x-auto overflow-y-hidden'>
        <div className='flex gap-3 min-w-max items-start'>
          {lists?.map((list) => (
            <DroppableListItem key={list.id} id={list.id}>
              <ListItem list={list} slug={slug} />
            </DroppableListItem>
          ))}

          <DragOverlay>{activeCard ? <CardItem card={activeCard} /> : null}</DragOverlay>
          <div className='flex-shrink-0'>
            <CreateListButton boardId={boardId} slug={slug} />
          </div>
        </div>
      </div>
    </DndContext>
  )
}

const DroppableListItem = ({ id, children }: { id: string; children: React.ReactNode }) => {
  const { setNodeRef, isOver } = useDroppable({
    id
  })

  return (
    <div ref={setNodeRef} className={cn(isOver && 'border-2 rounded-2xl border-primary')}>
      {children}
    </div>
  )
}
