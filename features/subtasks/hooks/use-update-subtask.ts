'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useAction } from 'next-safe-action/hooks'
import { useCallback } from 'react'
import { toast } from 'sonner'
import { useDebouncedCallback } from 'use-debounce'
import { updateSingleTask } from '../actions'

export function useUpdateSubtask(boardSlug: string, cardSlug: string) {
  const queryClient = useQueryClient()

  const updateTaskAction = useAction(updateSingleTask, {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['card', boardSlug, cardSlug] })
      queryClient.invalidateQueries({ queryKey: ['board', 'lists', boardSlug] })
    },
    onError: ({ error }) => {
      toast.error(error.serverError || 'Có lỗi xảy ra khi cập nhật trạng thái việc cần làm')
    }
  })

  const updateTaskStatus = useCallback(
    (taskId: string, isDone: boolean) => {
      updateTaskAction.execute({
        boardSlug,
        cardSlug,
        taskId,
        isDone
      })
    },
    [updateTaskAction, boardSlug, cardSlug]
  )

  // Debounced version for better UX
  const updateTaskStatusDebounced = useDebouncedCallback(updateTaskStatus, 100)

  return {
    updateTaskStatus,
    updateTaskStatusDebounced,
    updateTaskAction
  }
}
