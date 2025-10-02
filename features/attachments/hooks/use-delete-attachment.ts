import { useQueryClient } from '@tanstack/react-query'
import { useAction } from 'next-safe-action/hooks'
import { toast } from 'sonner'
import { deleteAttachment } from '../actions'
import { invalidateAttachmentQueries } from '../utils'

export const useDeleteAttachment = (boardSlug: string, cardSlug: string) => {
  const queryClient = useQueryClient()

  const deleteAttachmentAction = useAction(deleteAttachment, {
    onSettled: () => {
      invalidateAttachmentQueries(queryClient, boardSlug, cardSlug)
    },
    onError: (err) => {
      toast.error(err.error?.serverError || 'Lỗi khi xóa đính kèm.')
    }
  })

  return { deleteAttachmentAction }
}
