import z from 'zod'

export const createListSchema = z.object({
  name: z.string().min(1, 'Tên danh sách không được để trống'),
  boardId: z.string().min(1, 'Board ID không được để trống'),
  slug: z.string().min(1, 'Slug không được để trống')
})

export const moveListSchema = z.object({
  listId: z.string().min(1, 'List ID không được để trống'),
  newPosition: z.number().min(0, 'Vị trí mới phải lớn hơn hoặc bằng 0'),
  slug: z.string().min(1, 'Slug không được để trống')
})

export type CreateListSchema = z.infer<typeof createListSchema>
export type MoveListSchema = z.infer<typeof moveListSchema>
