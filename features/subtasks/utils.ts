import { getTempId, updateBoardListsQuery, updateCardDetailQuery } from '@/lib/utils'
import { QueryClient } from '@tanstack/react-query'

export const createTempSubtask = (title: string, cardId: string, parentId: string | null = null) => {
  const now = new Date()

  return {
    id: getTempId('task'),
    title,
    isDeleted: false,
    createdAt: now,
    updatedAt: now,
    isDone: false,
    cardId,
    parentId,
    children: []
  }
}

export const addSubtaskToCard = (
  queryClient: QueryClient,
  boardSlug: string,
  cardSlug: string,
  title: string,
  parentId?: string
) => {
  if (parentId) {
    // Adding child subtask
    updateCardDetailQuery(queryClient, boardSlug, cardSlug, (prev) => {
      const subtaskIndex = prev.subtasks.findIndex((subtask) => subtask.id === parentId)
      if (subtaskIndex === -1) return prev

      const newSubtask = createTempSubtask(title, prev.id, parentId)
      const newSubtasks = [...prev.subtasks[subtaskIndex].children, newSubtask]

      return {
        ...prev,
        subtasks: [
          ...prev.subtasks.slice(0, subtaskIndex),
          { ...prev.subtasks[subtaskIndex], children: newSubtasks },
          ...prev.subtasks.slice(subtaskIndex + 1)
        ]
      }
    })
  } else {
    // Adding parent subtask
    updateCardDetailQuery(queryClient, boardSlug, cardSlug, (prev) => ({
      ...prev,
      subtasks: [...prev.subtasks, createTempSubtask(title, prev.id)]
    }))
  }
}

// Queries (multiple setQueryData)
export const removeSubtaskFromCardQueries = (
  queryClient: QueryClient,
  boardSlug: string,
  cardSlug: string,
  subtaskId: string
) => {
  // Update card detail query - remove parent subtask
  updateCardDetailQuery(queryClient, boardSlug, cardSlug, (prev) => ({
    ...prev,
    subtasks: prev.subtasks.filter((child) => child.id !== subtaskId)
  }))

  // Update board lists query
  updateBoardListsQuery(queryClient, boardSlug, (prev) => {
    return prev.map((list) => {
      const card = list.cards.find((card) => card.slug === cardSlug)
      if (!card) return list

      return {
        ...list,
        cards: list.cards.map((card) => ({
          ...card,
          subtasks: card.subtasks.filter((child) => child.id !== subtaskId)
        }))
      }
    })
  })
}

export const removeChildSubtaskFromCardQueries = (
  queryClient: QueryClient,
  boardSlug: string,
  cardSlug: string,
  subtaskId: string
) => {
  // Update card detail query - remove child subtask
  updateCardDetailQuery(queryClient, boardSlug, cardSlug, (prev) => ({
    ...prev,
    subtasks: prev.subtasks.map((subtask) => ({
      ...subtask,
      children: subtask.children.filter((child) => child.id !== subtaskId)
    }))
  }))

  // Update board lists query
  updateBoardListsQuery(queryClient, boardSlug, (prev) => {
    return prev.map((list) => {
      const card = list.cards.find((card) => card.slug === cardSlug)
      if (!card) return list

      return {
        ...list,
        cards: list.cards.map((card) => ({
          ...card,
          subtasks: card.subtasks.map((subtask) => ({
            ...subtask,
            children: subtask.children.filter((child) => child.id !== subtaskId)
          }))
        }))
      }
    })
  })
}

export const toggleSubtaskStatusQueries = (
  queryClient: QueryClient,
  boardSlug: string,
  cardSlug: string,
  childrenId: string,
  checked: boolean
) => {
  // Update card detail query
  updateCardDetailQuery(queryClient, boardSlug, cardSlug, (prev) => ({
    ...prev,
    subtasks: prev.subtasks.map((subtask) => ({
      ...subtask,
      children: subtask.children.map((child) => ({
        ...child,
        isDone: child.id === childrenId ? checked : child.isDone
      }))
    }))
  }))

  // Update board lists query
  updateBoardListsQuery(queryClient, boardSlug, (prev) => {
    return prev.map((list) => {
      const card = list.cards.find((card) => card.slug === cardSlug)
      if (!card) return list

      return {
        ...list,
        cards: list.cards.map((card) => ({
          ...card,
          subtasks: card.subtasks.map((subtask) => ({
            ...subtask,
            children: subtask.children.map((child) => ({
              ...child,
              isDone: child.id === childrenId ? checked : child.isDone
            }))
          }))
        }))
      }
    })
  })
}

// Invalidates
export const invalidateSubtaskQueries = (queryClient: QueryClient, boardSlug: string, cardSlug: string) => {
  queryClient.invalidateQueries({ queryKey: ['card', boardSlug, cardSlug] })
  queryClient.invalidateQueries({ queryKey: ['board', 'lists', boardSlug] })
}
