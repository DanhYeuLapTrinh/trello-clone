import { zodResolver } from '@hookform/resolvers/zod'
import { useAction } from 'next-safe-action/hooks'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { unassignLabel } from '../actions'
import { unassignLabelSchema, UnassignLabelSchema } from '../validations'
import { useQueryClient } from '@tanstack/react-query'

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

      queryClient.invalidateQueries({ queryKey: ['card', boardSlug, cardSlug] })
      queryClient.invalidateQueries({ queryKey: ['board', 'lists', boardSlug] })
      queryClient.invalidateQueries({ queryKey: ['board', 'labels', boardSlug] })
    },
    onError: (err) => {
      toast.error(err.error?.serverError || 'Lỗi khi gỡ bỏ label.')
    }
  })

  return { methods, unassignLabelAction }
}
