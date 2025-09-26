import { useQueryClient } from '@tanstack/react-query'
import { useAction } from 'next-safe-action/hooks'
import { toast } from 'sonner'
import { deleteSubtask } from '../actions'
import { invalidateSubtaskQueries } from '../utils'

export const useDeleteSubtask = (boardSlug: string, cardSlug: string) => {
  const queryClient = useQueryClient()

  const deleteSubtaskAction = useAction(deleteSubtask, {
    onSuccess: () => {
      invalidateSubtaskQueries(queryClient, boardSlug, cardSlug)
    },
    onError: (err) => {
      toast.error(err.error?.serverError || 'Lỗi khi xóa subtask')
    }
  })

  return { deleteSubtaskAction }
}
