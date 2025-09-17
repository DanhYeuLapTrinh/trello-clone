'use client'

import DndProvider from '@/components/dnd/dnd.provider'
import Draggable from '@/components/dnd/draggable'
import Droppable from '@/components/dnd/droppable'
import { Card } from '@/components/ui/card'
import { getBoardListsWithCards } from '@/features/boards/actions'
import { moveCardWithinList } from '@/features/cards/actions'
import CreateCardButton from '@/features/cards/components/create-card-button'
import CreateListButton from '@/features/lists/components/create-list-button'
import ListItem from '@/features/lists/components/list-item'
import { arrayMove } from '@/lib/utils'
import { DragEndEvent, DragOverEvent, DragStartEvent } from '@dnd-kit/core'
import { Card as CardType, List } from '@prisma/client'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAction } from 'next-safe-action/hooks'

type ListWithCards = List & { cards: CardType[] }

interface BoardContentProps {
  boardId: string
  boardSlug: string
}

export default function BoardContent({ boardId, boardSlug }: BoardContentProps) {
  const queryClient = useQueryClient()

  const { data: lists } = useQuery({
    queryKey: ['board', 'lists', boardSlug],
    queryFn: () => getBoardListsWithCards(boardSlug)
  })

  const { executeAsync: moveCardWithinListAction } = useAction(moveCardWithinList)

  const handleDragStart = (event: DragStartEvent) => {
    console.log('Drag started:', event)
  }

  const handleDragOver = (event: DragOverEvent) => {
    console.log('Drag over:', event)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    // Move card
    if (event.active?.data?.current?.type === 'card' && event.over?.data?.current?.type === 'card') {
      const listId = event.active.data.current.listId
      const activeCardId = event.active.data.current.cardId
      const overCardId = event.over.data.current.cardId

      // 1. Optimistic update
      queryClient.setQueryData(['board', 'lists', boardSlug], (oldLists: ListWithCards[] | undefined) => {
        if (!oldLists) return oldLists

        // Find the list we're working in
        const listIndex = oldLists.findIndex((l) => l.id === listId)

        if (listIndex < 0) return oldLists
        const list = oldLists[listIndex]

        // Find the indices inside that list
        const oldIndex = list.cards.findIndex((c) => c.id === activeCardId)
        const newIndex = list.cards.findIndex((c) => c.id === overCardId)

        if (oldIndex < 0 || newIndex < 0) return oldLists

        // Move the card
        const newCards = arrayMove(list.cards, oldIndex, newIndex)
        const newLists = [...oldLists]

        // Update the list with the new cards
        newLists[listIndex] = { ...list, cards: newCards }

        return newLists
      })

      // 2. Call action to server
      moveCardWithinListAction({
        activeCardId,
        overCardId,
        listId,
        slug: boardSlug
      }).then(() => {
        queryClient.invalidateQueries({ queryKey: ['board', 'lists', boardSlug] })
      })
    }
  }

  return (
    <DndProvider onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
      <div className='flex-1 p-3 overflow-x-auto overflow-y-hidden'>
        <div className='flex gap-3 min-w-max items-start'>
          {lists?.map((list) => (
            <Draggable
              key={list.id}
              id={`list>${list.id}`}
              data={{
                type: 'list',
                listId: list.id,
                listName: list.name
              }}
            >
              <Card key={list.id} className='w-72 p-2 shadow-md bg-muted flex flex-col gap-2'>
                <Droppable
                  key={list.id}
                  id={`list>${list.id}`}
                  className='flex gap-3'
                  data={{
                    type: 'list',
                    listId: list.id,
                    listName: list.name
                  }}
                >
                  <ListItem list={list} />
                </Droppable>

                <CreateCardButton listId={list.id} slug={boardSlug} />
              </Card>
            </Draggable>
          ))}

          <div className='flex-shrink-0'>
            <CreateListButton boardId={boardId} slug={boardSlug} />
          </div>
        </div>
      </div>
    </DndProvider>
  )
}
