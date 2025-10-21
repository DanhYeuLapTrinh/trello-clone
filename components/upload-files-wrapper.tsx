import { useUploadFiles } from '@/hooks/use-upload-files'
import { DEFAULT_ALLOWED_TYPES } from '@/lib/constants'
import { FileInfo } from '@/types/common'
import { VariantProps } from 'class-variance-authority'
import { useRef } from 'react'
import { Button, buttonVariants } from './ui/button'

interface UploadFilesWrapperProps extends React.ComponentProps<'button'>, VariantProps<typeof buttonVariants> {
  children: React.ReactNode
  allowedTypes?: string[]
  onSuccess?: (files: FileInfo[]) => void
  onError?: () => void
  folder?: string
  multiple?: boolean
  disabled?: boolean
}

export default function UploadFilesWrapper({
  children,
  allowedTypes = [...DEFAULT_ALLOWED_TYPES],
  onSuccess,
  onError,
  folder = 'uploads',
  multiple = false,
  disabled = false,
  ...props
}: UploadFilesWrapperProps) {
  const { uploadFilesAction } = useUploadFiles({ onSuccess, onError })
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUploadFile = () => {
    if (disabled) return
    fileInputRef.current?.click()
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files
    if (!selectedFiles || selectedFiles.length === 0) return

    const files = multiple ? Array.from(selectedFiles) : [selectedFiles[0]]
    const validFiles = files.filter((file) => allowedTypes.includes(file.type))

    if (validFiles.length === 0) return

    uploadFilesAction.execute({
      files,
      folder
    })

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <>
      <Button onClick={handleUploadFile} disabled={disabled || uploadFilesAction.isPending} type='button' {...props}>
        {children}
      </Button>
      <input
        ref={fileInputRef}
        type='file'
        accept={allowedTypes.join(',')}
        onChange={handleFileChange}
        style={{ display: 'none' }}
        disabled={disabled}
        multiple={multiple}
      />
    </>
  )
}
