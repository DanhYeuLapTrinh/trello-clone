import { BoardBackground, BoardVisibility } from '@prisma/client'
import z from 'zod'

export const createBoardSchema = z.object({
  name: z.string().min(3, 'Tên quá ngắn >= 3').max(255).trim(),
  workspaceId: z.uuid(),
  description: z.string().trim().optional(),
  background: z.enum(BoardBackground),
  visibility: z.enum(BoardVisibility)
})

export type CreateBoardSchema = z.infer<typeof createBoardSchema>
