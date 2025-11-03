import { uploadFiles } from '@/shared/actions'
import { FileInfo } from '@/shared/types'
import { useAction } from 'next-safe-action/hooks'
import { toast } from 'sonner'

interface UseUploadFilesProps {
  onSuccess?: (files: FileInfo[]) => void
  onError?: () => void
}

export const useUploadFiles = ({ onSuccess, onError }: UseUploadFilesProps) => {
  const uploadFilesAction = useAction(uploadFiles, {
    onExecute: () => {
      toast.loading('Đang tải tệp lên...', {
        id: 'upload-files'
      })
    },
    onSuccess: ({ data }) => {
      if (onSuccess) {
        onSuccess(data)
      }
      toast.success('Thành công.', {
        id: 'upload-files'
      })
    },
    onError: (err) => {
      if (onError) {
        onError()
      }
      toast.error(err.error?.serverError || 'Lỗi khi tải tệp.', {
        id: 'upload-files'
      })
    }
  })

  return { uploadFilesAction }
}
