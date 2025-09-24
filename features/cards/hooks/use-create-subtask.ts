import { zodResolver } from '@hookform/resolvers/zod'
import { useAction } from 'next-safe-action/hooks'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { createSubtask } from '../actions'
import { CreateSubtaskSchema, createSubtaskSchema } from '../validations'

interface UseCreateSubtaskProps {
  defaultValues: CreateSubtaskSchema
}

export const useCreateSubtask = ({ defaultValues }: UseCreateSubtaskProps) => {
  const methods = useForm<CreateSubtaskSchema>({
    defaultValues,
    resolver: zodResolver(createSubtaskSchema)
  })

  const createSubtaskAction = useAction(createSubtask, {
    onSuccess: () => {
      methods.reset()
    },
    onError: (err) => {
      toast.error(err.error?.serverError || 'Lỗi khi tạo label.')
    }
  })

  return { methods, createSubtaskAction }
}
