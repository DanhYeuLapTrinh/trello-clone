import { Prisma } from '@prisma/client'

// Select
export const userSelect = {
  id: true,
  fullName: true,
  email: true,
  imageUrl: true
} satisfies Prisma.UserSelect

// Types
export type UIUser = Prisma.UserGetPayload<{
  select: typeof userSelect
}>
