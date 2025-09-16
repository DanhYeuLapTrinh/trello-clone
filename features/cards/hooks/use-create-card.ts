import { zodResolver } from '@hookform/resolvers/zod'
import { useAction } from 'next-safe-action/hooks'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { createCard } from '../actions'
import { createCardSchema, CreateCardSchema } from '../validations'

export const useCreateCard = (listId: string, slug: string, onSuccess?: () => void) => {
  const methods = useForm<CreateCardSchema>({
    defaultValues: {
      title: '',
      listId,
      slug
    },
    resolver: zodResolver(createCardSchema)
  })

  const createCardAction = useAction(createCard, {
    onSuccess: () => {
      toast.success('Thẻ đã được thêm thành công.')
      methods.reset()
      onSuccess?.()
    },
    onError: (err) => {
      toast.error(err.error?.serverError || 'Lỗi khi thêm thẻ.')
    }
  })

  return { methods, createCardAction }
}
