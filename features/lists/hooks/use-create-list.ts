import { zodResolver } from '@hookform/resolvers/zod'
import { useAction } from 'next-safe-action/hooks'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { createList } from '../actions'
import { createListSchema, CreateListSchema } from '../validations'

export const useCreateList = (boardId: string, slug: string, onSuccess?: () => void) => {
  const methods = useForm<CreateListSchema>({
    defaultValues: {
      name: '',
      boardId,
      slug
    },
    resolver: zodResolver(createListSchema)
  })

  const createListAction = useAction(createList, {
    onSuccess: () => {
      toast.success('Danh sách đã được thêm thành công.')
      methods.reset()
      onSuccess?.()
    },
    onError: (err) => {
      toast.error(err.error?.serverError || 'Lỗi khi thêm danh sách.')
    }
  })

  return { methods, createListAction }
}
