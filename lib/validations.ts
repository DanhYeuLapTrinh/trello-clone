import { z } from 'zod'
import { DEFAULT_ALLOWED_TYPES } from './constants'

export const uploadFileSchema = z.object({
  file: z
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
    ),
  folder: z.string().optional().default('uploads'),
  customFileName: z.string().optional()
})

export const deleteFileSchema = z.object({
  filePath: z.string().min(1, 'File path is required'),
  url: z.url('Valid URL is required').optional()
})

export type UploadFileSchema = z.infer<typeof uploadFileSchema>
export type DeleteFileSchema = z.infer<typeof deleteFileSchema>
