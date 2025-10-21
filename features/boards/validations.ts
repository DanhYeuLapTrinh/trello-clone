import { BoardBackground, BoardVisibility, Role } from '@prisma/client'
import z from 'zod'

export const createBoardSchema = z.object({
  name: z.string().min(3, 'Tên quá ngắn >= 3').max(255).trim(),
  workspaceId: z.uuid(),
  description: z.string().trim().optional(),
  background: z.enum(BoardBackground),
  visibility: z.enum(BoardVisibility)
})

export const shareBoardSchema = z.object({
  value: z.array(
    z.object({
      userId: z.uuid(),
      email: z.email(),
      fullName: z.string().trim()
    })
  ),
  role: z.enum(Role),
  description: z.string().trim().optional(),
  boardSlug: z.string()
})

export type CreateBoardSchema = z.infer<typeof createBoardSchema>
export type ShareBoardSchema = z.infer<typeof shareBoardSchema>
