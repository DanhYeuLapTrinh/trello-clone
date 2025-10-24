import { ButlerCategory } from '@prisma/client'
import { useQueryClient } from '@tanstack/react-query'
import { useAction } from 'next-safe-action/hooks'
import { toast } from 'sonner'
import { createButler } from '../actions'
import { invalidateBoardButlersQueries } from '../utils'

export const useCreateButler = (boardSlug: string, category: ButlerCategory) => {
  const queryClient = useQueryClient()

  const createButlerAction = useAction(createButler, {
    onSettled: () => {
      invalidateBoardButlersQueries(queryClient, boardSlug, category)
    },
    onError: (err) => {
      toast.error(err.error?.serverError || 'Lỗi khi tạo butler.')
    }
  })

  return { createButlerAction }
}
