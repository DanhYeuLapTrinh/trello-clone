import { useQueryClient } from '@tanstack/react-query'
import { useAction } from 'next-safe-action/hooks'
import { toast } from 'sonner'
import { createComment } from '../actions'
import { invalidateCommentQueries } from '../utils'

export const useCreateComment = (boardSlug: string, cardSlug: string) => {
  const queryClient = useQueryClient()

  const createCommentAction = useAction(createComment, {
    onSettled: () => {
      invalidateCommentQueries(queryClient, boardSlug, cardSlug)
    },
    onError: (err) => {
      toast.error(err.error?.serverError || 'Lỗi khi tạo bình luận.')
    }
  })

  return { createCommentAction }
}
