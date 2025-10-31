import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { useAction } from 'next-safe-action/hooks'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { unassignLabel } from '../actions'
import { invalidateLabelQueries } from '../utils'
import { unassignLabelSchema, UnassignLabelSchema } from '../validations'

export const useUnassignLabel = (boardSlug: string, cardSlug: string) => {
  const queryClient = useQueryClient()

  const methods = useForm<UnassignLabelSchema>({
    resolver: zodResolver(unassignLabelSchema),
    defaultValues: {
      boardSlug,
      cardSlug
    }
  })

  const unassignLabelAction = useAction(unassignLabel, {
    onSuccess: () => {
      methods.reset()
    },
    onError: (err) => {
      toast.error(err.error?.serverError || 'Lỗi khi gỡ bỏ label.')
    },
    onSettled: () => {
      invalidateLabelQueries(queryClient, boardSlug, cardSlug)
    }
  })

  return { methods, unassignLabelAction }
}
