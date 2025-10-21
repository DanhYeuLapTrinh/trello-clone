import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { useAction } from 'next-safe-action/hooks'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { updateAttachment } from '../actions'
import { invalidateAttachmentQueries } from '../utils'
import { updateAttachmentSchema, UpdateAttachmentSchema } from '../validations'

interface UseUpdateAttachmentProps {
  boardSlug: string
  cardSlug: string
  attachmentId: string
  url: string
  fileName: string
  fileType: string
}

export const useUpdateAttachment = ({
  boardSlug,
  cardSlug,
  attachmentId,
  url,
  fileName,
  fileType
}: UseUpdateAttachmentProps) => {
  const queryClient = useQueryClient()

  const methods = useForm<UpdateAttachmentSchema>({
    defaultValues: {
      boardSlug,
      cardSlug,
      attachmentId,
      url,
      fileName,
      fileType
    },
    resolver: zodResolver(updateAttachmentSchema)
  })

  const updateAttachmentAction = useAction(updateAttachment, {
    onError: (err) => {
      toast.error(err.error?.serverError || 'Lỗi khi sửa tệp đính kèm.')
    },
    onSettled: () => {
      invalidateAttachmentQueries(queryClient, boardSlug, cardSlug)
    }
  })

  return { methods, updateAttachmentAction }
}
