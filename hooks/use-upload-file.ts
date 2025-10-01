import { uploadFile } from '@/lib/actions'
import { useAction } from 'next-safe-action/hooks'
import { toast } from 'sonner'

interface UseUploadFileProps {
  onSuccess?: () => void
  onError?: () => void
}

export const useUploadFile = ({ onSuccess, onError }: UseUploadFileProps) => {
  const uploadFileAction = useAction(uploadFile, {
    onExecute: () => {
      toast.loading('Đang tải tệp lên...', {
        id: 'upload-file'
      })
    },
    onSuccess: () => {
      if (onSuccess) {
        onSuccess()
      }
      toast.success('Thành công.', {
        id: 'upload-file'
      })
    },
    onError: (err) => {
      if (onError) {
        onError()
      }
      toast.error(err.error?.serverError || 'Lỗi khi tải tệp.', {
        id: 'upload-file'
      })
    }
  })

  return { uploadFileAction }
}
