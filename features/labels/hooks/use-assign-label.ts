import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { useAction } from 'next-safe-action/hooks'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { assignLabel } from '../actions'
import { invalidateLabelQueries } from '../utils'
import { assignLabelSchema, AssignLabelSchema } from '../validations'

export const useAssignLabel = (boardSlug: string, cardSlug: string) => {
  const queryClient = useQueryClient()

  const methods = useForm<AssignLabelSchema>({
    resolver: zodResolver(assignLabelSchema),
    defaultValues: {
      boardSlug,
      cardSlug
    }
  })

  const assignLabelAction = useAction(assignLabel, {
    onSuccess: () => {
      methods.reset()
    },
    onError: (err) => {
      toast.error(err.error?.serverError || 'Lỗi khi gán label.')
    },
    onSettled: () => {
      invalidateLabelQueries(queryClient, boardSlug, cardSlug)
    }
  })

  return { methods, assignLabelAction }
}
