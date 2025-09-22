import { zodResolver } from '@hookform/resolvers/zod'
import { useAction } from 'next-safe-action/hooks'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { createLabel } from '../actions'
import { CreateLabelSchema, createLabelSchema } from '../validations'

export const useCreateLabel = (boardSlug: string, cardSlug: string) => {
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
    },
    onError: (err) => {
      toast.error(err.error?.serverError || 'Lỗi khi tạo label.')
    }
  })

  return { methods, createLabelAction }
}
