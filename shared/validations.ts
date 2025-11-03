import { z } from 'zod'
import { DEFAULT_ALLOWED_TYPES } from './constants'

const fileSchema = z
  .instanceof(File, { message: 'Please select a file' })
  .refine((file) => file.size <= 10 * 1024 * 1024, {
    message: 'File size must be less than 10MB'
  })
  .refine(
    (file) => {
      return DEFAULT_ALLOWED_TYPES.includes(file.type)
    },
    {
      message: `File type not supported. Please upload one of: ${DEFAULT_ALLOWED_TYPES.join(', ')}`
    }
  )

export const uploadFilesSchema = z.object({
  files: z.array(fileSchema).min(1, 'Please upload at least one file'),
  folder: z.string().optional().default('uploads')
})

export const deleteFileSchema = z
  .object({
    filePath: z.string().optional(),
    url: z.url('Valid URL is required').optional()
  })
  .refine((data) => data.filePath || data.url, {
    message: 'Either filePath or url is required'
  })

export type UploadFilesSchema = z.infer<typeof uploadFilesSchema>
export type DeleteFileSchema = z.infer<typeof deleteFileSchema>
