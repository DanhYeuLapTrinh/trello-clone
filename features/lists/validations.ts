import z from 'zod'

export const createListSchema = z.object({
  name: z.string().min(1, 'Tên danh sách không được để trống'),
  boardId: z.uuid(),
  slug: z.string().min(1, 'Slug không được để trống')
})

export const moveListSchema = z.object({
  listId: z.uuid(),
  newPosition: z.number(),
  slug: z.string().min(1, 'Slug không được để trống')
})

export type CreateListSchema = z.infer<typeof createListSchema>
export type MoveListSchema = z.infer<typeof moveListSchema>
