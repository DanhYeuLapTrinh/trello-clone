import { getTempId, updateBoardListsQuery, updateCardDetailQuery } from '@/lib/utils'
import { Attachment } from '@prisma/client'
import { QueryClient } from '@tanstack/react-query'

export const getWebsiteName = (url: string): string => {
  try {
    const { hostname } = new URL(url)

    // Remove "www."
    const domain = hostname.replace(/^www\./, '')

    // Take only the first part before the dot
    const mainPart = domain.split('.')[0]

    // Title Case it
    return mainPart
      .split(/[-_]/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join('')
  } catch {
    return ''
  }
}

export const createTempAttachment = (fileType: string, url: string, fileName?: string): Attachment => {
  const now = new Date()

  return {
    id: getTempId('attachment'),
    cardId: getTempId('card'),
    fileName: fileName || getWebsiteName(url),
    fileType,
    url,
    isDeleted: false,
    createdAt: now,
    updatedAt: now
  }
}

// Queries
export const addAttachmentQueries = ({
  queryClient,
  boardSlug,
  cardSlug,
  fileName,
  fileType,
  url
}: {
  queryClient: QueryClient
  boardSlug: string
  cardSlug: string
  fileName?: string
  fileType: string
  url: string
}) => {
  updateCardDetailQuery(queryClient, boardSlug, cardSlug, (prev) => ({
    ...prev,
    attachments: [createTempAttachment(fileType, url, fileName), ...prev.attachments]
  }))

  updateBoardListsQuery(queryClient, boardSlug, (prev) => {
    return prev.map((list) => ({
      ...list,
      cards: list.cards.map((card) =>
        card.slug === cardSlug
          ? {
              ...card,
              _count: {
                ...card._count,
                attachments: card._count.attachments + 1
              }
            }
          : card
      )
    }))
  })
}

export const deleteAttachmentQueries = ({
  queryClient,
  boardSlug,
  cardSlug,
  attachmentId
}: {
  queryClient: QueryClient
  boardSlug: string
  cardSlug: string
  attachmentId: string
}) => {
  updateCardDetailQuery(queryClient, boardSlug, cardSlug, (prev) => ({
    ...prev,
    attachments: prev.attachments.filter((attachment) => attachment.id !== attachmentId)
  }))

  updateBoardListsQuery(queryClient, boardSlug, (prev) => {
    return prev.map((list) => ({
      ...list,
      cards: list.cards.map((card) =>
        card.slug === cardSlug
          ? {
              ...card,
              _count: {
                ...card._count,
                attachments: card._count.attachments - 1
              }
            }
          : card
      )
    }))
  })
}

export const updateAttachmentQueries = ({
  boardSlug,
  cardSlug,
  queryClient,
  attachmentId,
  fileName,
  url,
  fileType
}: {
  queryClient: QueryClient
  boardSlug: string
  cardSlug: string
  attachmentId: string
  fileName?: string
  url: string
  fileType: string
}) => {
  updateCardDetailQuery(queryClient, boardSlug, cardSlug, (prev) => ({
    ...prev,
    attachments: prev.attachments.map((attachment) =>
      attachment.id === attachmentId
        ? { ...attachment, fileName: fileName || getWebsiteName(url), url, fileType }
        : attachment
    )
  }))
}

// Invalidates
export const invalidateAttachmentQueries = (queryClient: QueryClient, boardSlug: string, cardSlug: string) => {
  queryClient.invalidateQueries({ queryKey: ['card', boardSlug, cardSlug] })
  queryClient.invalidateQueries({ queryKey: ['board', 'lists', boardSlug] })
}
