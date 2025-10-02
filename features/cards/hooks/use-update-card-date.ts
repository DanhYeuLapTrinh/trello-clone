import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { useAction } from 'next-safe-action/hooks'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { updateCardDate } from '../actions'
import { invalidateCardQueries } from '../utils'
import { updateCardDateSchema, UpdateCardDateSchema } from '../validations'

interface UseUpdateCardDateProps {
  boardSlug: string
  cardSlug: string
  defaultValues: UpdateCardDateSchema
}

export const useUpdateCardDate = ({ boardSlug, cardSlug, defaultValues }: UseUpdateCardDateProps) => {
  const queryClient = useQueryClient()

  const methods = useForm<UpdateCardDateSchema>({
    defaultValues,
    resolver: zodResolver(updateCardDateSchema)
  })

  const updateCardAction = useAction(updateCardDate, {
    onSettled: () => {
      invalidateCardQueries(queryClient, boardSlug, cardSlug)
    },
    onError: (err) => {
      toast.error(err.error?.serverError || 'Lỗi khi cập nhật nhắc nhở.')
    }
  })
  return { methods, updateCardAction }
}
