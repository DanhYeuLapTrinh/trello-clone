import { useQueryClient } from '@tanstack/react-query'
import { useAction } from 'next-safe-action/hooks'
import { toast } from 'sonner'
import { deleteLabel } from '../actions'

export const useDeleteLabel = (boardSlug: string, cardSlug: string) => {
  const queryClient = useQueryClient()

  const deleteLabelAction = useAction(deleteLabel, {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['card', boardSlug, cardSlug] })
      queryClient.invalidateQueries({ queryKey: ['board', 'lists', boardSlug] })
      queryClient.invalidateQueries({ queryKey: ['board', 'labels', boardSlug] })
    },
    onError: (err) => {
      toast.error(err.error?.serverError || 'Lỗi khi xóa label.')
    }
  })

  return { deleteLabelAction }
}
