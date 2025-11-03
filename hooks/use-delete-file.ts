import { deleteFile } from '@/shared/actions'
import { useAction } from 'next-safe-action/hooks'
import { toast } from 'sonner'

interface UseDeleteFileProps {
  onSuccess?: () => void
  onError?: () => void
}

export const useDeleteFile = ({ onSuccess, onError }: UseDeleteFileProps) => {
  const deleteFileAction = useAction(deleteFile, {
    onExecute: () => {
      toast.loading('Đang xóa tệp...', {
        id: 'delete-file'
      })
    },
    onSuccess: () => {
      if (onSuccess) {
        onSuccess()
      }
      toast.success('Thành công.', {
        id: 'delete-file'
      })
    },
    onError: (err) => {
      if (onError) {
        onError()
      }
      toast.error(err.error?.serverError || 'Lỗi khi xóa tệp.', {
        id: 'delete-file'
      })
    }
  })

  return { deleteFileAction }
}
