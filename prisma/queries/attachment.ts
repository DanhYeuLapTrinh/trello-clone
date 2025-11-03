import { Prisma } from '@prisma/client'

// Select
export const attachmentSelect = {
  id: true,
  fileName: true,
  fileType: true,
  url: true,
  createdAt: true
} satisfies Prisma.AttachmentSelect

// Types
export type UIAttachment = Prisma.AttachmentGetPayload<{
  select: typeof attachmentSelect
}>
