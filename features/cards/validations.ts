import z from 'zod'

export const createCardSchema = z.object({
  title: z.string().min(1, 'Tên thẻ không được để trống'),
  slug: z.string().min(1, 'Slug không được để trống'),
  listId: z.string().min(1, 'List ID không được để trống')
})

export type CreateCardSchema = z.infer<typeof createCardSchema>
