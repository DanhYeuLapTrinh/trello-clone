import { useQueryClient } from '@tanstack/react-query'
import { useAction } from 'next-safe-action/hooks'
import { toast } from 'sonner'
import { deleteSubtask } from '../actions'

export const useDeleteSubtask = (boardSlug: string, cardSlug: string) => {
  const queryClient = useQueryClient()

  const deleteSubtaskAction = useAction(deleteSubtask, {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['card', boardSlug, cardSlug] })
      queryClient.invalidateQueries({ queryKey: ['board', 'lists', boardSlug] })
    },
    onError: (err) => {
      toast.error(err.error?.serverError || 'Lỗi khi xóa subtask')
    }
  })

  return { deleteSubtaskAction }
}
