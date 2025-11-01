import { zodResolver } from '@hookform/resolvers/zod'
import { useAction } from 'next-safe-action/hooks'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { createBoard } from '../actions'
import { createBoardSchema, CreateBoardSchema } from '../validations'

export const useCreateBoard = (workspaceId: string) => {
  const router = useRouter()

  const methods = useForm<CreateBoardSchema>({
    defaultValues: {
      name: '',
      workspaceId,
      background: 'OCEAN',
      visibility: 'WORKSPACE'
    },
    resolver: zodResolver(createBoardSchema)
  })

  const { executeAsync, isPending, result } = useAction(createBoard, {
    onSuccess: () => {
      toast.success('Bảng đã được tạo thành công.')
      router.push(`/b/${result.data?.slug}`)
      setTimeout(() => {
        methods.reset()
      }, 500)
    },
    onError: (err) => {
      toast.error(err.error?.serverError || 'Lỗi khi tạo bảng.')
    }
  })

  return { methods, executeAsync, isPending }
}
