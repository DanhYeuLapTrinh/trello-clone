import { useQueryClient } from '@tanstack/react-query'
import { useAction } from 'next-safe-action/hooks'
import { toast } from 'sonner'
import { toggleWatchCard } from '../actions'
import { invalidateCardQueries } from '../utils'

export const useToggleWatchCard = (boardSlug: string, cardSlug: string) => {
  const queryClient = useQueryClient()

  const toggleWatchCardAction = useAction(toggleWatchCard, {
    onSettled: () => {
      invalidateCardQueries(queryClient, boardSlug, cardSlug)
    },
    onError: (err) => {
      toast.error(err.error?.serverError || 'Lỗi khi theo dõi thẻ.')
    }
  })

  return { toggleWatchCardAction }
}
