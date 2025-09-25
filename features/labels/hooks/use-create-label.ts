import { zodResolver } from '@hookform/resolvers/zod'
import { useAction } from 'next-safe-action/hooks'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { createLabel } from '../actions'
import { createLabelSchema, CreateLabelSchema } from '../validations'
import { useQueryClient } from '@tanstack/react-query'

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

      queryClient.invalidateQueries({ queryKey: ['card', boardSlug, cardSlug] })
      queryClient.invalidateQueries({ queryKey: ['board', 'lists', boardSlug] })
      queryClient.invalidateQueries({ queryKey: ['board', 'labels', boardSlug] })
    },
    onError: (err) => {
      toast.error(err.error?.serverError || 'Lỗi khi tạo label.')
    }
  })

  return { methods, createLabelAction }
}
