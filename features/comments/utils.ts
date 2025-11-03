import { CardTimeline, TimelineItemType } from '@/shared/types'
import { getTempId, updateBoardListsQuery, updateCardDetailQuery } from '@/shared/utils'
import { Comment, User } from '@prisma/client'
import { QueryClient } from '@tanstack/react-query'

export const createTempComment = (
  content: string,
  firstName: string,
  lastName: string,
  fullName: string,
  imageUrl: string
): Comment & { user: User } & { __type: TimelineItemType.Comment } => {
  const now = new Date()

  return {
    id: getTempId('comment'),
    content,
    cardId: getTempId('card'),
    userId: getTempId('user'),
    isDeleted: false,
    createdAt: now,
    updatedAt: now,
    __type: TimelineItemType.Comment,
    user: {
      id: getTempId('user'),
      clerkId: getTempId('clerk'),
      email: getTempId('email'),
      firstName,
      lastName,
      fullName,
      imageUrl,
      isDeleted: false,
      createdAt: now,
      updatedAt: now
    }
  }
}

export const updateCardTimelineQuery = (
  queryClient: QueryClient,
  boardSlug: string,
  cardSlug: string,
  updater: (prev: CardTimeline) => CardTimeline
) => {
  queryClient.setQueryData(['card', 'activities', 'comments', boardSlug, cardSlug], (prev: CardTimeline) => {
    if (!prev) return prev
    return updater(prev)
  })
}

export const createCommentQueries = ({
  queryClient,
  boardSlug,
  cardSlug,
  content,
  firstName,
  lastName,
  fullName,
  imageUrl
}: {
  queryClient: QueryClient
  boardSlug: string
  cardSlug: string
  content: string
  firstName: string
  lastName: string
  fullName: string
  imageUrl: string
}) => {
  updateCardTimelineQuery(queryClient, boardSlug, cardSlug, (prev) => {
    return {
      ...prev,
      comments: [createTempComment(content, firstName, lastName, fullName, imageUrl), ...prev.comments],
      sortedList: [createTempComment(content, firstName, lastName, fullName, imageUrl), ...prev.sortedList]
    }
  })

  updateBoardListsQuery(queryClient, boardSlug, (prev) => {
    return prev.map((list) => ({
      ...list,
      cards: list.cards.map((card) => {
        if (card.slug === cardSlug) {
          return {
            ...card,
            _count: {
              ...card._count,
              comments: card._count.comments + 1
            }
          }
        }

        return card
      })
    }))
  })
}

export const updateCardBackgroundQueries = (
  queryClient: QueryClient,
  boardSlug: string,
  cardSlug: string,
  imageUrl: string
) => {
  updateCardDetailQuery(queryClient, boardSlug, cardSlug, (prev) => {
    return {
      ...prev,
      imageUrl
    }
  })

  updateBoardListsQuery(queryClient, boardSlug, (prev) => {
    return prev.map((list) => ({
      ...list,
      cards: list.cards.map((card) => {
        if (card.slug === cardSlug) {
          return {
            ...card,
            imageUrl
          }
        }

        return card
      })
    }))
  })
}

// Invalidates
export const invalidateCommentQueries = (queryClient: QueryClient, boardSlug: string, cardSlug: string) => {
  queryClient.invalidateQueries({ queryKey: ['card', 'activities', 'comments', boardSlug, cardSlug] })
  queryClient.invalidateQueries({ queryKey: ['board', 'lists', 'cards', boardSlug] })
}
