'use client'

import CardItem from '@/features/cards/components/card-item'
import CreateListButton from '@/features/lists/components/create-list-button'
import ListItem from '@/features/lists/components/list-item'
import { defaultDropAnimation, DndContext, DragOverlay, rectIntersection } from '@dnd-kit/core'
import { horizontalListSortingStrategy, SortableContext } from '@dnd-kit/sortable'
import { useQuery } from '@tanstack/react-query'
import { getBoardListsWithCards } from '../actions'
import { useDragAndDrop } from '../hooks/use-drag-and-drop'

interface BoardContentProps {
  boardId: string
  slug: string
}

export default function BoardContent({ boardId, slug }: BoardContentProps) {
  const { data: lists } = useQuery({
    queryKey: ['board', 'lists', slug],
    queryFn: () => getBoardListsWithCards(slug)
  })

  const { sensors, activeCard, activeList, handleDragStart, handleDragOver, handleDragEnd } = useDragAndDrop({
    lists,
    slug
  })

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

          <DragOverlay dropAnimation={defaultDropAnimation}>
            {activeCard ? <CardItem card={activeCard} slug={slug} /> : null}
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
