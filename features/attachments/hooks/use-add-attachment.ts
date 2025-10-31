import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { useAction } from 'next-safe-action/hooks'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { addAttachment } from '../actions'
import { invalidateAttachmentQueries } from '../utils'
import { addAttachmentSchema, AddAttachmentSchema } from '../validations'

export const useAddAttachment = (cardSlug: string, boardSlug: string) => {
  const queryClient = useQueryClient()

  const methods = useForm<AddAttachmentSchema>({
    defaultValues: {
      boardSlug,
      cardSlug,
      fileName: '',
      fileType: 'href',
      url: ''
    },
    resolver: zodResolver(addAttachmentSchema)
  })

  const addAttachmentAction = useAction(addAttachment, {
    onError: (err) => {
      toast.error(err.error?.serverError || 'Lỗi khi thêm đính kèm.')
    },
    onSettled: () => {
      methods.reset()
      invalidateAttachmentQueries(queryClient, boardSlug, cardSlug)
    }
  })

  return { methods, addAttachmentAction }
}
