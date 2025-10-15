import { zodResolver } from '@hookform/resolvers/zod'
import { useAction } from 'next-safe-action/hooks'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { shareBoard } from '../actions'
import { shareBoardSchema, ShareBoardSchema } from '../validations'

export const useShareBoard = (boardSlug: string) => {
  const methods = useForm<ShareBoardSchema>({
    defaultValues: {
      boardSlug,
      value: [],
      description: '',
      role: 'Member'
    },
    resolver: zodResolver(shareBoardSchema)
  })

  const shareBoardAction = useAction(shareBoard, {
    onSuccess: () => {
      methods.reset()
    },
    onError: (err) => {
      toast.error(err.error?.serverError || 'Lỗi khi chia sẻ bảng.')
    }
  })

  return { methods, shareBoardAction }
}
