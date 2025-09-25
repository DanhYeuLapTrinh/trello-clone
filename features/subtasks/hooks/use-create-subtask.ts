import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { useAction } from 'next-safe-action/hooks'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { createSubtask } from '../actions'
import { createSubtaskSchema, CreateSubtaskSchema } from '../validations'

interface UseCreateSubtaskProps {
  boardSlug: string
  cardSlug: string
  defaultValues: CreateSubtaskSchema
}

export const useCreateSubtask = ({ boardSlug, cardSlug, defaultValues }: UseCreateSubtaskProps) => {
  const queryClient = useQueryClient()

  const methods = useForm<CreateSubtaskSchema>({
    defaultValues,
    resolver: zodResolver(createSubtaskSchema)
  })

  const createSubtaskAction = useAction(createSubtask, {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['card', boardSlug, cardSlug] })
      queryClient.invalidateQueries({ queryKey: ['board', 'lists', boardSlug] })
    },
    onError: (err) => {
      toast.error(err.error?.serverError || 'Lỗi khi tạo label.')
    }
  })

  return { methods, createSubtaskAction }
}
