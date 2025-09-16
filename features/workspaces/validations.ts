import { z } from 'zod'

export const createWorkspaceSchema = z.object({
  name: z.string().min(3, 'Tên quá ngắn >= 3').max(255),
  shortName: z
    .string()
    .min(3, 'Tên quá ngắn >= 3')
    .max(255)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Chỉ được dùng chữ thường, số và dấu gạch ngang (-), không khoảng trắng'),
  websiteUrl: z.string().optional(),
  description: z.string().optional(),
  imageUrl: z.string().optional()
})

export type CreateWorkspaceSchema = z.infer<typeof createWorkspaceSchema>
