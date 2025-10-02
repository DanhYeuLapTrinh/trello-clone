import { useQueryClient } from '@tanstack/react-query'
import { useAction } from 'next-safe-action/hooks'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { updateLabel } from '../actions'
import { invalidateLabelQueries } from '../utils'
import { UpdateLabelSchema } from '../validations'

export const useUpdateLabel = (defaultValues: UpdateLabelSchema) => {
  const queryClient = useQueryClient()
  const methods = useForm<UpdateLabelSchema>({
    defaultValues
  })

  const updateLabelAction = useAction(updateLabel, {
    onSuccess: () => {
      methods.reset()
    },
    onError: (err) => {
      toast.error(err.error?.serverError || 'Lỗi khi cập nhật label.')
    },
    onSettled: () => {
      invalidateLabelQueries(queryClient, defaultValues.boardSlug, defaultValues.cardSlug)
    }
  })

  return { methods, updateLabelAction }
}
