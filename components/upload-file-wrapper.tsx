import { useUploadFile } from '@/hooks/use-upload-file'
import { DEFAULT_ALLOWED_TYPES } from '@/lib/constants'
import { VariantProps } from 'class-variance-authority'
import { useRef } from 'react'
import { Button, buttonVariants } from './ui/button'

interface UploadFileWrapperProps extends React.ComponentProps<'button'>, VariantProps<typeof buttonVariants> {
  children: React.ReactNode
  allowedTypes?: string[]
  onSuccess?: () => void
  onError?: () => void
  folder?: string
  multiple?: boolean
  customFileName?: string
  disabled?: boolean
}

export default function UploadFileWrapper({
  children,
  allowedTypes = [...DEFAULT_ALLOWED_TYPES],
  onSuccess,
  onError,
  folder = 'uploads',
  multiple = false,
  customFileName,
  disabled = false,
  ...props
}: UploadFileWrapperProps) {
  const { uploadFileAction } = useUploadFile({ onSuccess, onError })
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

    try {
      if (multiple) {
        const uploadPromises = validFiles.map((file) =>
          uploadFileAction.execute({
            file,
            folder,
            customFileName
          })
        )
        await Promise.all(uploadPromises)
      } else {
        uploadFileAction.execute({
          file: validFiles[0],
          folder,
          customFileName
        })
      }
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <>
      <Button onClick={handleUploadFile} disabled={disabled || uploadFileAction.isPending} type='button' {...props}>
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
