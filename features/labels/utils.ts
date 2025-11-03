import { UILabel, UILabelDetail } from '@/prisma/queries/label'
import { ListWithCards } from '@/prisma/queries/list'
import { getTempId, updateBoardListsQuery, updateCardDetailQuery } from '@/shared/utils'
import { Label } from '@prisma/client'
import { QueryClient } from '@tanstack/react-query'
import { UpdateCardFn } from '../cards/utils'

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

export const getDisplayLabels = (
  boardLabels: UILabel[] | undefined,
  sortedCardLabelColors: typeof import('@/shared/constants').sortedCardLabelColors
) => {
  const maxLabels = 7
  const displayedLabels = []

  // Add existing board labels first
  const existingLabels = boardLabels || []
  displayedLabels.push(...existingLabels)

  // Add available color options to reach exactly 7 total
  const remainingSlots = maxLabels - existingLabels.length
  if (remainingSlots > 0) {
    const usedColors = new Set(existingLabels.map((label) => label.color))
    const availableColors = sortedCardLabelColors
      .map((color) => color.shades.find((shade) => shade.isDefaultDisplay))
      .filter((shade): shade is NonNullable<typeof shade> => shade !== undefined && !usedColors.has(shade.value))
      .slice(0, remainingSlots)

    displayedLabels.push(
      { type: 'divider' as const },
      ...availableColors.map((shade) => ({
        type: 'color-option' as const,
        shade
      }))
    )
  }

  return displayedLabels
}

export const createTempCardLabel = (labelId: string, cardId: string, label: Label) => {
  const now = new Date()

  return {
    id: getTempId('cardlabel'),
    labelId,
    cardId,
    label,
    createdAt: now,
    updatedAt: now
  }
}

export const createTempLabel = (title: string, color: string) => {
  const now = new Date()
  return {
    id: getTempId('label'),
    title,
    boardId: null,
    color,
    isDeleted: false,
    createdAt: now,
    updatedAt: now
  }
}

export const updateBoardLabelsQuery = (
  queryClient: QueryClient,
  boardSlug: string,
  updater: (prev: Label[]) => Label[]
) => {
  queryClient.setQueryData(['board', 'labels', boardSlug], (prev: Label[]) => {
    if (!prev) return prev
    return updater(prev)
  })
}

// Queries (multiple setQueryData)
export const addLabelToCardQueries = (queryClient: QueryClient, boardSlug: string, cardSlug: string, label: Label) => {
  // Update card detail query
  updateCardDetailQuery(queryClient, boardSlug, cardSlug, (prev) => {
    const newCardLabel = createTempCardLabel(label.id, prev.id, label)
    return {
      ...prev,
      cardLabels: [...prev.cardLabels, newCardLabel]
    }
  })

  // Update board lists query
  updateBoardListsQuery(queryClient, boardSlug, (prev) => {
    return updateCardInLists(prev, cardSlug, (card) => {
      const newCardLabel = createTempCardLabel(label.id, card.id, label)
      return {
        ...card,
        cardLabels: [...card.cardLabels, newCardLabel]
      }
    })
  })
}

export const removeLabelFromCardQueries = (
  queryClient: QueryClient,
  boardSlug: string,
  cardSlug: string,
  labelId: string
) => {
  // Update card detail query
  updateCardDetailQuery(queryClient, boardSlug, cardSlug, (prev) => ({
    ...prev,
    cardLabels: prev.cardLabels.filter((cardLabel) => cardLabel.labelId !== labelId)
  }))

  // Update board lists query
  updateBoardListsQuery(queryClient, boardSlug, (prev) => {
    return updateCardInLists(prev, cardSlug, (card) => ({
      ...card,
      cardLabels: card.cardLabels.filter((cl) => cl.labelId !== labelId)
    }))
  })
}

export const createLabelWithAssignmentQueries = (
  queryClient: QueryClient,
  boardSlug: string,
  cardSlug: string,
  title: string,
  color: string
) => {
  const tempLabel = createTempLabel(title, color)

  // Update card detail query
  updateCardDetailQuery(queryClient, boardSlug, cardSlug, (prev) => {
    const newCardLabel = createTempCardLabel(tempLabel.id, prev.id, tempLabel)
    return {
      ...prev,
      cardLabels: [...prev.cardLabels.filter((label) => label.label.color !== color), newCardLabel]
    }
  })

  // Update board lists query
  updateBoardListsQuery(queryClient, boardSlug, (prev) => {
    return updateCardInLists(prev, cardSlug, (card) => {
      const newCardLabel = createTempCardLabel(tempLabel.id, card.id, tempLabel)
      return {
        ...card,
        cardLabels: [...card.cardLabels.filter((label) => label.label.color !== color), newCardLabel]
      }
    })
  })

  // Update board labels query
  updateBoardLabelsQuery(queryClient, boardSlug, (prev) => {
    return [tempLabel, ...prev.filter((label) => label.color !== color)]
  })

  return tempLabel
}

export const updateLabelInQueries = (
  queryClient: QueryClient,
  boardSlug: string,
  cardSlug: string,
  labelId: string,
  updates: { title?: string; color?: string }
) => {
  // Update card detail query
  updateCardDetailQuery(queryClient, boardSlug, cardSlug, (prev) => {
    const labelIndex = prev.cardLabels.findIndex((label) => label.label.id === labelId)
    if (labelIndex === -1) return prev

    const newLabel: UILabelDetail = {
      ...prev.cardLabels[labelIndex],
      label: {
        ...prev.cardLabels[labelIndex].label,
        color: updates.color !== undefined ? updates.color : prev.cardLabels[labelIndex].label.color,
        title: updates.title !== undefined ? updates.title : prev.cardLabels[labelIndex].label.title
      }
    }

    const newCardLabels = [
      ...prev.cardLabels.slice(0, labelIndex).filter((label) => label.label.id !== labelId),
      newLabel,
      ...prev.cardLabels.slice(labelIndex + 1).filter((label) => label.label.id !== labelId)
    ]

    return {
      ...prev,
      cardLabels: newCardLabels
    }
  })

  // Update board lists query
  updateBoardListsQuery(queryClient, boardSlug, (prev) => {
    return prev.map((list) => {
      const updatedCards = list.cards.map((card) => {
        const labelIndex = card.cardLabels.findIndex((cl) => cl.label.id === labelId)
        if (labelIndex === -1) return card

        const updatedLabel: UILabelDetail = {
          ...card.cardLabels[labelIndex],
          label: {
            ...card.cardLabels[labelIndex].label,
            color: updates.color !== undefined ? updates.color : card.cardLabels[labelIndex].label.color,
            title: updates.title !== undefined ? updates.title : card.cardLabels[labelIndex].label.title
          }
        }

        const newCardLabels = [...card.cardLabels]
        newCardLabels[labelIndex] = updatedLabel

        return {
          ...card,
          cardLabels: newCardLabels
        }
      })

      return {
        ...list,
        cards: updatedCards
      }
    })
  })

  // Update board labels query
  updateBoardLabelsQuery(queryClient, boardSlug, (prev) => {
    const labelIndex = prev.findIndex((label) => label.id === labelId)
    if (labelIndex === -1) return prev

    const newLabel: Label = {
      ...prev[labelIndex],
      color: updates.color !== undefined ? updates.color : prev[labelIndex].color,
      title: updates.title !== undefined ? updates.title : prev[labelIndex].title
    }

    return [newLabel, ...prev.filter((label) => label.id !== labelId)]
  })
}

export const deleteLabelFromQueries = (
  queryClient: QueryClient,
  boardSlug: string,
  cardSlug: string,
  labelId: string
) => {
  // Update card detail query - remove from all cards
  updateCardDetailQuery(queryClient, boardSlug, cardSlug, (prev) => ({
    ...prev,
    cardLabels: prev.cardLabels.filter((label) => label.label.id !== labelId)
  }))

  // Update board lists query
  updateBoardListsQuery(queryClient, boardSlug, (prev) => {
    return prev.map((list) => ({
      ...list,
      cards: list.cards.map((card) => ({
        ...card,
        cardLabels: card.cardLabels.filter((cl) => cl.label.id !== labelId)
      }))
    }))
  })

  // Update board labels query
  updateBoardLabelsQuery(queryClient, boardSlug, (prev) => {
    return prev.filter((label) => label.id !== labelId)
  })
}

// Invalidates
export const invalidateLabelQueries = (queryClient: QueryClient, boardSlug: string, cardSlug: string) => {
  queryClient.invalidateQueries({ queryKey: ['card', boardSlug, cardSlug] })
  queryClient.invalidateQueries({ queryKey: ['board', 'lists', 'cards', boardSlug] })
  queryClient.invalidateQueries({ queryKey: ['board', 'labels', boardSlug] })
}
