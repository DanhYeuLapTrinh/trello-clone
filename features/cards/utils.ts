import { updateBoardListsQuery, updateCardDetailQuery } from '@/lib/utils'
import { CardDetail, CardPreview, ListWithCards } from '@/types/common'
import { UpdateCardFn } from '@/types/ui'
import { QueryClient } from '@tanstack/react-query'
import { differenceInHours, differenceInMinutes, format, isPast, parse } from 'date-fns'
import { UpdateCardDateSchema } from './validations'

export const getCardDateLabel = (startDate?: Date | string | null, endDate?: Date | string | null) => {
  const start = startDate ? new Date(startDate) : null
  const end = endDate ? new Date(endDate) : null

  if (end && isPast(end)) {
    return 'Thẻ đã hết hạn'
  }

  if (start && end) {
    return 'Ngày'
  }

  if (start && !end) {
    return 'Ngày bắt đầu'
  }

  return 'Ngày hết hạn'
}

export const formatCardDate = (date: Date | string | null | undefined) => {
  if (!date) return null
  return format(new Date(date), "d 'thg' M")
}

export const formatCardDateTime = (date: Date | string | null | undefined) => {
  if (!date) return null
  return format(new Date(date), "H:mm d 'thg' M")
}

export const formatCardDateRange = (startDate?: Date | string | null, endDate?: Date | string | null) => {
  const start = startDate ? formatCardDate(startDate) : null
  const end = endDate ? formatCardDate(endDate) : null

  if (start && end) {
    return `${start} - ${end}`
  }

  return start || end || ''
}

export const hasCardLabels = (cardLabels?: Array<{ label: { color?: string | null } }> | null) => {
  return cardLabels && Array.isArray(cardLabels) && cardLabels.length > 0
}

export const hasCardDates = (startDate?: Date | string | null, endDate?: Date | string | null) => {
  return startDate || endDate
}

export const hasSubtasks = (subtasks?: Array<{ children: unknown[] }> | null) => {
  return subtasks && Array.isArray(subtasks) && subtasks.length > 0
}

export const shouldDisplayCardIcons = (card: {
  _count?: { comments: number; attachments: number }
  description?: string | null
  subtasks?: Array<{ children: unknown[] }>
  startDate?: Date | string | null
  endDate?: Date | string | null
}) => {
  return (
    (card._count?.comments ?? 0) > 0 ||
    (card._count?.attachments ?? 0) > 0 ||
    card.description ||
    hasSubtasks(card.subtasks) ||
    hasCardDates(card.startDate, card.endDate)
  )
}

export const getSubtaskStats = (subtasks: Array<{ children: Array<{ isDone: boolean }> }>) => {
  const doneSubtasks = subtasks.reduce(
    (acc, subtask) => acc + subtask.children.filter((child) => child.isDone).length,
    0
  )
  const totalSubtasks = subtasks.reduce((acc, subtask) => acc + subtask.children.length, 0)

  return { doneSubtasks, totalSubtasks }
}

export const getVisibleCardLabels = <T extends { id: string; label: { color?: string | null } }>(
  cardLabels?: T[] | null
) => {
  if (!cardLabels || !Array.isArray(cardLabels)) return []
  return cardLabels.filter((cardLabel) => cardLabel.label.color)
}

export const updateCardInLists = (lists: ListWithCards[], cardSlug: string, updater: UpdateCardFn): ListWithCards[] => {
  // Find the list index
  const listIndex = lists.findIndex((list) => list.cards.some((card) => card.slug === cardSlug))
  if (listIndex === -1) return lists

  const cards = lists[listIndex].cards
  const cardIndex = cards.findIndex((card) => card.slug === cardSlug)
  if (cardIndex === -1) return lists

  // Apply updater to card (modify the card data through the updater function)
  const updatedCard = updater(cards[cardIndex])

  // Replace card in cards array
  const updatedCards = [...cards.slice(0, cardIndex), updatedCard, ...cards.slice(cardIndex + 1)]

  // Replace list
  const updatedList = {
    ...lists[listIndex],
    cards: updatedCards
  }

  // Replace list in lists array
  return [...lists.slice(0, listIndex), updatedList, ...lists.slice(listIndex + 1)]
}

// Queries (multiple setQueryData)
export const updateCardDateQueries = ({
  queryClient,
  boardSlug,
  cardSlug,
  data,
  dateFormat
}: {
  queryClient: QueryClient
  boardSlug: string
  cardSlug: string
  data: UpdateCardDateSchema
  dateFormat: string
}) => {
  updateCardDetailQuery(queryClient, boardSlug, cardSlug, (prev) => {
    const newCard: CardDetail = {
      ...prev,
      startDate: data.startDate ? parse(data.startDate, dateFormat, new Date()) : null,
      endDate: data.endDate ? parse(`${data.endDate} ${data.endTime}`, 'MM/dd/yyyy H:mm', new Date()) : null,
      reminderType: data.reminderType
    }

    return newCard
  })

  updateBoardListsQuery(queryClient, boardSlug, (prev) => {
    return prev.map((list) => {
      if (list.cards.some((card) => card.slug === cardSlug)) {
        const cardIndex = list.cards.findIndex((card) => card.slug === cardSlug)

        const newCard: CardPreview = {
          ...list.cards[cardIndex],
          startDate: data.startDate ? parse(data.startDate, dateFormat, new Date()) : null,
          endDate: data.endDate ? parse(`${data.endDate} ${data.endTime}`, 'MM/dd/yyyy H:mm', new Date()) : null,
          reminderType: data.reminderType
        }

        return { ...list, cards: list.cards.map((card, index) => (index === cardIndex ? newCard : card)) }
      }
      return list
    })
  })
}

export const deleteCardDateQueries = ({
  queryClient,
  boardSlug,
  cardSlug
}: {
  queryClient: QueryClient
  boardSlug: string
  cardSlug: string
}) => {
  updateCardDetailQuery(queryClient, boardSlug, cardSlug, (prev) => {
    const newCard: CardDetail = {
      ...prev,
      startDate: null,
      endDate: null,
      reminderType: 'NONE'
    }

    return newCard
  })

  updateBoardListsQuery(queryClient, boardSlug, (prev) => {
    return prev.map((list) => {
      if (list.cards.some((card) => card.slug === cardSlug)) {
        const cardIndex = list.cards.findIndex((card) => card.slug === cardSlug)

        const newCard: CardPreview = {
          ...list.cards[cardIndex],
          startDate: null,
          endDate: null,
          reminderType: 'NONE'
        }

        return { ...list, cards: list.cards.map((card, index) => (index === cardIndex ? newCard : card)) }
      }
      return list
    })
  })
}

// Invalidates
export const invalidateCardQueries = (queryClient: QueryClient, boardSlug: string, cardSlug: string) => {
  queryClient.invalidateQueries({ queryKey: ['card', boardSlug, cardSlug] })
  queryClient.invalidateQueries({ queryKey: ['board', 'lists', boardSlug] })
}

export function formatDateRelativeVN(date: Date) {
  const now = new Date()

  const diffMinutes = differenceInMinutes(now, date)
  const diffHours = differenceInHours(now, date)

  if (diffMinutes < 1) {
    return 'vừa xong'
  }

  if (diffMinutes < 60) {
    return `${diffMinutes} phút trước`
  }

  if (diffHours < 24) {
    return `${diffHours} tiếng trước`
  }

  return format(date, "HH:mm d 'thg' M, yyyy")
}
