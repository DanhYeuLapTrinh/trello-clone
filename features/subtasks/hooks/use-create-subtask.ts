import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { useAction } from 'next-safe-action/hooks'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { createSubtask } from '../actions'
import { invalidateSubtaskQueries } from '../utils'
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
    onSettled: () => {
      invalidateSubtaskQueries(queryClient, boardSlug, cardSlug)
    },
    onError: (err) => {
      toast.error(err.error?.serverError || 'Lỗi khi tạo label.')
    }
  })

  return { methods, createSubtaskAction }
}
