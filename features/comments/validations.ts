import z from 'zod'

export const createCommentSchema = z.object({ boardSlug: z.string(), cardSlug: z.string(), content: z.string() })

export type CreateCommentSchema = z.infer<typeof createCommentSchema>
