import { zodResolver } from '@hookform/resolvers/zod'
import { useAction } from 'next-safe-action/hooks'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { assignLabel } from '../actions'
import { assignLabelSchema, AssignLabelSchema } from '../validations'
import { useQueryClient } from '@tanstack/react-query'

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

      queryClient.invalidateQueries({ queryKey: ['card', boardSlug, cardSlug] })
      queryClient.invalidateQueries({ queryKey: ['board', 'lists', boardSlug] })
      queryClient.invalidateQueries({ queryKey: ['board', 'labels', boardSlug] })
    },
    onError: (err) => {
      toast.error(err.error?.serverError || 'Lỗi khi gán label.')
    }
  })

  return { methods, assignLabelAction }
}
