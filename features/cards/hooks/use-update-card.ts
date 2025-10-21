import { zodResolver } from '@hookform/resolvers/zod'
import { useAction } from 'next-safe-action/hooks'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { updateCard } from '../actions'
import { updateCardSchema, UpdateCardSchema } from '../validations'

export const useUpdateCard = () => {
  const methods = useForm<UpdateCardSchema>({
    resolver: zodResolver(updateCardSchema)
  })

  const updateCardAction = useAction(updateCard, {
    onSuccess: () => {
      toast.success('Thẻ đã được cập nhật thành công.')
    },
    onError: (err) => {
      toast.error(err.error?.serverError || 'Lỗi khi cập nhật thẻ.')
    }
  })

  return { methods, updateCardAction }
}
