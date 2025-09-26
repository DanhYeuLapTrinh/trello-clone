import { useQueryClient } from '@tanstack/react-query'
import { useAction } from 'next-safe-action/hooks'
import { toast } from 'sonner'
import { deleteLabel } from '../actions'
import { invalidateLabelQueries } from '../utils'

export const useDeleteLabel = (boardSlug: string, cardSlug: string) => {
  const queryClient = useQueryClient()

  const deleteLabelAction = useAction(deleteLabel, {
    onSuccess: () => {
      invalidateLabelQueries(queryClient, boardSlug, cardSlug)
    },
    onError: (err) => {
      toast.error(err.error?.serverError || 'Lỗi khi xóa label.')
    }
  })

  return { deleteLabelAction }
}
