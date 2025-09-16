import z from 'zod'

export const createListSchema = z.object({
  name: z.string().min(1, 'Tên danh sách không được để trống'),
  boardId: z.string().min(1, 'Board ID không được để trống'),
  slug: z.string().min(1, 'Slug không được để trống')
})

export type CreateListSchema = z.infer<typeof createListSchema>
