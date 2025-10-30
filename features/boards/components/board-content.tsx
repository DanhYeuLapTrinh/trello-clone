'use client'

import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import CardItem from '@/features/cards/components/card-item'
import CreateListButton from '@/features/lists/components/create-list-button'
import ListItem from '@/features/lists/components/list-item'
import { defaultDropAnimation, DndContext, DragOverlay, rectIntersection } from '@dnd-kit/core'
import { horizontalListSortingStrategy, SortableContext } from '@dnd-kit/sortable'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ChannelProvider, useChannel } from 'ably/react'
import { getBoardListsWithCards } from '../actions'
import { useDragAndDrop } from '../hooks/use-drag-and-drop'

interface BoardContentProps {
  boardId: string
  slug: string
  channelName: string
}

const BoardContentInner = ({ boardId, slug, channelName }: BoardContentProps) => {
  const queryClient = useQueryClient()

  useChannel(channelName, (message) => {
    queryClient.invalidateQueries({ queryKey: ['board', 'lists', 'cards', message.data.boardSlug] })
  })

  const { data: lists } = useQuery({
    queryKey: ['board', 'lists', 'cards', slug],
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
      <ScrollArea className='flex-1 overflow-x-auto overflow-y-hidden'>
        <div className='flex gap-3 min-w-max items-start p-3'>
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

          <div className='shrink-0'>
            <CreateListButton boardId={boardId} slug={slug} />
          </div>
        </div>
        <ScrollBar orientation='horizontal' />
      </ScrollArea>
    </DndContext>
  )
}

export default function BoardContent({ boardId, slug, channelName }: BoardContentProps) {
  return (
    <ChannelProvider channelName={channelName}>
      <BoardContentInner boardId={boardId} slug={slug} channelName={channelName} />
    </ChannelProvider>
  )
}
