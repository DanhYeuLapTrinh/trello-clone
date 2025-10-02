import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { useAction } from 'next-safe-action/hooks'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { createLabel } from '../actions'
import { invalidateLabelQueries } from '../utils'
import { createLabelSchema, CreateLabelSchema } from '../validations'

export const useCreateLabel = (boardSlug: string, cardSlug: string) => {
  const queryClient = useQueryClient()

  const methods = useForm<CreateLabelSchema>({
    resolver: zodResolver(createLabelSchema),
    defaultValues: {
      boardSlug,
      cardSlug
    }
  })

  const createLabelAction = useAction(createLabel, {
    onSuccess: () => {
      methods.reset()
    },
    onError: (err) => {
      toast.error(err.error?.serverError || 'Lỗi khi tạo label.')
    },
    onSettled: () => {
      invalidateLabelQueries(queryClient, boardSlug, cardSlug)
    }
  })

  return { methods, createLabelAction }
}
