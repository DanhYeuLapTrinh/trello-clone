import { zodResolver } from '@hookform/resolvers/zod'
import { useAction } from 'next-safe-action/hooks'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { assignLabel } from '../actions'
import { assignLabelSchema, AssignLabelSchema } from '../validations'

export const useAssignLabel = (boardSlug: string, cardSlug: string) => {
  const methods = useForm<AssignLabelSchema>({
    resolver: zodResolver(assignLabelSchema),
    defaultValues: {
      boardSlug,
      cardSlug
    }
  })

  const assignLabelAction = useAction(assignLabel, {
    onSuccess: () => {
      methods.reset()
    },
    onError: (err) => {
      toast.error(err.error?.serverError || 'Lỗi khi gán label.')
    }
  })

  return { methods, assignLabelAction }
}
