import z from 'zod'

export const addAttachmentSchema = z.object({
  fileName: z.string().optional(),
  fileType: z.string(),
  url: z.url(),
  cardSlug: z.string(),
  boardSlug: z.string()
})

export const deleteAttachmentSchema = z.object({
  attachmentId: z.uuid(),
  url: z.url(),
  fileType: z.string(),
  boardSlug: z.string(),
  cardSlug: z.string()
})

export const updateAttachmentSchema = z.object({
  attachmentId: z.uuid(),
  url: z.url(),
  fileName: z.string().optional(),
  fileType: z.string(),
  boardSlug: z.string(),
  cardSlug: z.string()
})

export type AddAttachmentSchema = z.infer<typeof addAttachmentSchema>
export type DeleteAttachmentSchema = z.infer<typeof deleteAttachmentSchema>
export type UpdateAttachmentSchema = z.infer<typeof updateAttachmentSchema>
