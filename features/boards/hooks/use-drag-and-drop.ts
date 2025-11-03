'use client'

import { moveCardBetweenLists, moveCardWithinList } from '@/features/cards/actions'
import { moveList } from '@/features/lists/actions'
import { CardPreview } from '@/prisma/queries/card'
import { ListWithCards } from '@/prisma/queries/list'
import {
  Active,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  KeyboardSensor,
  Over,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core'
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { useQueryClient } from '@tanstack/react-query'
import { useAction } from 'next-safe-action/hooks'
import { useState } from 'react'
import { toast } from 'sonner'

interface UseDragAndDropProps {
  lists: ListWithCards[]
  slug: string
}

export function useDragAndDrop({ lists, slug }: UseDragAndDropProps) {
  const queryClient = useQueryClient()
  const [activeCard, setActiveCard] = useState<CardPreview | null>(null)
  const [activeList, setActiveList] = useState<ListWithCards | null>(null)
  const [originalActiveCard, setOriginalActiveCard] = useState<CardPreview | null>(null)

  const { execute: moveCardWithinListAction } = useAction(moveCardWithinList, {
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['board', 'lists', 'cards', slug] })
    },
    onError: (err) => {
      toast.error(err.error?.serverError || 'Lỗi khi di chuyển thẻ.')
    }
  })

  const { execute: moveCardBetweenListsAction } = useAction(moveCardBetweenLists, {
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['board', 'lists', 'cards', slug] })
    },
    onError: (err) => {
      toast.error(err.error?.serverError || 'Lỗi khi di chuyển thẻ giữa các danh sách.')
    }
  })

  const { execute: moveListAction } = useAction(moveList, {
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['board', 'lists', 'cards', slug] })
    },
    onError: (err) => {
      toast.error(err.error?.serverError || 'Lỗi khi di chuyển danh sách.')
    }
  })

  // Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8
      }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  )

  const calculateNewPosition = (active: Active, over: Over, overList: ListWithCards): number => {
    if (!over?.rect || !active.rect) return 0

    const overIndex = overList.cards.findIndex((card) => card.id === over.id)

    const isBelowLastItem =
      overIndex === overList.cards.length - 1 &&
      active.rect.current.translated &&
      active.rect.current.translated.top > over.rect.top + over.rect.height / 2

    if (isBelowLastItem) {
      return overList.cards.length
    }

    if (active.rect.current.translated && active.rect.current.translated.top > over.rect.top + over.rect.height / 2) {
      return overIndex + 1
    }

    return overIndex
  }

  const updateQueryCacheForCardMove = (
    activeId: string,
    activeListIndex: number,
    overListIndex: number,
    newPosition: number,
    movedCard: CardPreview
  ) => {
    queryClient.setQueryData(['board', 'lists', 'cards', slug], (oldLists: ListWithCards[]) => {
      if (!oldLists) return oldLists

      const newLists = [...oldLists]

      // Remove card from old list
      newLists[activeListIndex] = {
        ...newLists[activeListIndex],
        cards: newLists[activeListIndex].cards.filter((card) => card.id !== activeId)
      }

      // Insert card into new list
      const overCards = [...newLists[overListIndex].cards]
      overCards.splice(newPosition, 0, movedCard)

      newLists[overListIndex] = {
        ...newLists[overListIndex],
        cards: overCards
      }

      return newLists
    })
  }

  const updateQueryCacheForCardMoveToEmptyList = (
    activeId: string,
    activeList: ListWithCards,
    overListIndex: number
  ) => {
    queryClient.setQueryData(['board', 'lists', 'cards', slug], (oldLists: ListWithCards[]) => {
      if (!oldLists) return oldLists

      const newLists = [...oldLists]
      const activeListIndex = newLists.findIndex((list) => list.id === activeList.id)
      const movedCard = activeList.cards.find((card) => card.id === activeId)

      if (!movedCard) return oldLists

      // Remove card from old list
      newLists[activeListIndex] = {
        ...newLists[activeListIndex],
        cards: newLists[activeListIndex].cards.filter((card) => card.id !== activeId)
      }

      // Push card to the empty list
      newLists[overListIndex] = {
        ...newLists[overListIndex],
        cards: [...newLists[overListIndex].cards, movedCard]
      }

      return newLists
    })
  }

  const handleDragStart = ({ active }: DragStartEvent) => {
    const activeId = active.id
    const activeList = lists?.find((list) => list.cards.some((card) => card.id === activeId))

    if (activeList) {
      const card = lists?.flatMap((list) => list.cards).find((card) => card.id === active.id)
      setActiveCard(card ?? null)
      setOriginalActiveCard(card ?? null)
    } else {
      const list = lists?.find((list) => list.id === activeId)
      setActiveList(list ?? null)
      setOriginalActiveCard(null)
    }
  }

  const handleDragOver = ({ active, over }: DragOverEvent) => {
    if (!over || !lists) return

    const activeId = active.id
    const overId = over.id

    const activeList = lists.find((list) => list.cards.some((card) => card.id === activeId))
    const overList = lists.find((list) => list.cards.some((card) => card.id === overId))

    // Move card to another list
    if (activeList && overList && activeList.id !== overList.id) {
      const activeListIndex = lists.findIndex((list) => list.id === activeList.id)
      const overListIndex = lists.findIndex((list) => list.id === overList.id)
      const movedCard = activeList.cards.find((card) => card.id === activeId)

      if (!movedCard || activeListIndex === -1 || overListIndex === -1) return

      // FIXME: new postion sometimes is not correct
      const newPosition = calculateNewPosition(active, over, overList)
      updateQueryCacheForCardMove(activeId as string, activeListIndex, overListIndex, newPosition, movedCard)
    }

    // Move card to another empty list
    if (activeList && !overList) {
      const overListIndex = lists.findIndex((list) => list.id === overId)
      if (overListIndex === -1) return
      updateQueryCacheForCardMoveToEmptyList(activeId as string, activeList, overListIndex)
    }
  }

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveCard(null)
    setActiveList(null)
    setOriginalActiveCard(null)

    if (!over) return

    const activeId = active.id
    const overId = over.id
    const overList = lists?.find((list) => list.cards.some((card) => card.id === overId))

    if (originalActiveCard && overList) {
      if (originalActiveCard.listId === overList.id) {
        // Move card within list
        queryClient.setQueryData(['board', 'lists', 'cards', slug], (oldLists: ListWithCards[]) => {
          if (!oldLists) return oldLists

          const originalList = oldLists.find((list) => list.id === originalActiveCard.listId)
          if (!originalList) return oldLists

          const activeIndex = originalList.cards.findIndex((card) => card.id === activeId)
          const overIndex = originalList.cards.findIndex((card) => card.id === overId)

          if (activeIndex !== overIndex) {
            const newLists = [...oldLists]
            const listIndex = newLists.findIndex((list) => list.id === originalActiveCard.listId)
            const listToUpdate = newLists[listIndex]

            listToUpdate.cards = arrayMove(listToUpdate.cards, activeIndex, overIndex)
            newLists[listIndex] = listToUpdate

            moveCardWithinListAction({
              cardId: activeId as string,
              listId: originalActiveCard.listId,
              newPosition: overIndex,
              slug
            })

            return newLists
          }

          return oldLists
        })
      } else {
        // Move card to another list
        const newPosition = calculateNewPosition(active, over, overList)

        moveCardBetweenListsAction({
          cardId: activeId as string,
          sourceListId: originalActiveCard.listId,
          targetListId: overList.id,
          newPosition,
          slug
        })
      }
    } else if (originalActiveCard && !overList) {
      // Move card to empty list
      const targetList = lists?.find((list) => list.id === overId)

      if (targetList) {
        moveCardBetweenListsAction({
          cardId: activeId as string,
          sourceListId: originalActiveCard.listId,
          targetListId: targetList.id,
          newPosition: 0,
          slug
        })
      }
    } else {
      // Move list
      const activeIndex = lists?.findIndex((list) => list.id === activeId)
      const overIndex = lists?.findIndex((list) => list.id === overId)

      if (activeIndex !== overIndex && activeIndex !== undefined && overIndex !== undefined) {
        queryClient.setQueryData(['board', 'lists', 'cards', slug], (oldLists: ListWithCards[]) => {
          if (!oldLists) return oldLists
          return arrayMove([...oldLists], activeIndex, overIndex)
        })

        moveListAction({
          listId: activeId as string,
          newPosition: overIndex,
          slug
        })
      }
    }
  }

  return {
    sensors,
    activeCard,
    activeList,
    handleDragStart,
    handleDragOver,
    handleDragEnd
  }
}
