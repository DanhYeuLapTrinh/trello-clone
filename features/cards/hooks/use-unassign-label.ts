import { zodResolver } from '@hookform/resolvers/zod'
import { useAction } from 'next-safe-action/hooks'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { unassignLabel } from '../actions'
import { unassignLabelSchema, UnassignLabelSchema } from '../validations'

export const useUnassignLabel = (boardSlug: string, cardSlug: string) => {
  const methods = useForm<UnassignLabelSchema>({
    resolver: zodResolver(unassignLabelSchema),
    defaultValues: {
      boardSlug,
      cardSlug
    }
  })

  const unassignLabelAction = useAction(unassignLabel, {
    onSuccess: () => {
      methods.reset()
    },
    onError: (err) => {
      toast.error(err.error?.serverError || 'Lỗi khi gỡ bỏ label.')
    }
  })

  return { methods, unassignLabelAction }
}
