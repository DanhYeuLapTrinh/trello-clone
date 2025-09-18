'use client'

import { moveCardWithinList } from '@/features/cards/actions'
import CardItem from '@/features/cards/components/card-item'
import { moveList } from '@/features/lists/actions'
import CreateListButton from '@/features/lists/components/create-list-button'
import ListItem from '@/features/lists/components/list-item'
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
  useSensor,
  useSensors
} from '@dnd-kit/core'
import {
  arrayMove,
  horizontalListSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates
} from '@dnd-kit/sortable'
import { Card } from '@prisma/client'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAction } from 'next-safe-action/hooks'
import { useState } from 'react'
import { toast } from 'sonner'
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
  const [activeList, setActiveList] = useState<ListWithCards | null>(null)

  const { execute: moveCardWithinListAction } = useAction(moveCardWithinList, {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', 'lists', slug] })
    },
    onError: (err) => {
      toast.error(err.error?.serverError || 'Lỗi khi di chuyển thẻ.')
    }
  })

  const { execute: moveListAction } = useAction(moveList, {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', 'lists', slug] })
    },
    onError: (err) => {
      toast.error(err.error?.serverError || 'Lỗi khi di chuyển danh sách.')
    }
  })

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  )

  const handleDragStart = ({ active }: DragStartEvent) => {
    const activeId = active.id
    // Find the list that has the cardId === activeId
    const activeList = lists?.find((list) => list.cards.some((card) => card.id === activeId))

    if (activeList) {
      // If found the user is dragging a card
      const card = lists?.flatMap((list) => list.cards).find((card) => card.id === active.id)
      setActiveCard(card ?? null)
    } else {
      // If not found the user is dragging a list
      const list = lists?.find((list) => list.id === activeId)
      setActiveList(list ?? null)
    }
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
        // Move card within list
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
        // Move card to another list
      }
    } else if (activeList && !overList) {
      // Move card to empty list
    } else {
      // Move
      const activeIndex = lists?.findIndex((list) => list.id === activeId)
      const overIndex = lists?.findIndex((list) => list.id === overId)

      if (activeIndex !== overIndex && activeIndex !== undefined && overIndex !== undefined) {
        queryClient.setQueryData(['board', 'lists', slug], (oldLists: ListWithCards[]) => {
          if (!oldLists) return oldLists

          const newLists = [...oldLists]

          return arrayMove(newLists, activeIndex, overIndex)
        })

        moveListAction({
          listId: activeId as string,
          newPosition: overIndex,
          slug
        })
      }
    }

    setActiveCard(null)
    setActiveList(null)
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
          <SortableContext
            id={slug}
            items={lists?.map((list) => list.id) ?? []}
            strategy={horizontalListSortingStrategy}
          >
            {lists?.map((list) => (
              <ListItem key={list.id} list={list} slug={slug} />
            ))}
          </SortableContext>

          <DragOverlay>
            {activeCard ? <CardItem card={activeCard} /> : null}
            {activeList ? <ListItem list={activeList} slug={slug} /> : null}
          </DragOverlay>
          <div className='flex-shrink-0'>
            <CreateListButton boardId={boardId} slug={slug} />
          </div>
        </div>
      </div>
    </DndContext>
  )
}

// const DroppableArea = ({ id, children, className }: { id: string; children: React.ReactNode; className?: string }) => {
//   const { setNodeRef, isOver } = useDroppable({
//     id
//   })

//   return (
//     <div ref={setNodeRef} className={cn(className, isOver && 'border-2 rounded-2xl border-primary')}>
//       {children}
//     </div>
//   )
// }
