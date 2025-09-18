import z from 'zod'

export const createCardSchema = z.object({
  title: z.string().min(1, 'Tên thẻ không được để trống'),
  slug: z.string().min(1, 'Slug không được để trống'),
  listId: z.string().min(1, 'List ID không được để trống')
})

export const moveCardWithinListSchema = z.object({
  cardId: z.string().min(1, 'Card ID không được để trống'),
  listId: z.string().min(1, 'List ID không được để trống'),
  newPosition: z.number().min(0, 'Vị trí phải lớn hơn hoặc bằng 0'),
  slug: z.string().min(1, 'Slug không được để trống')
})

export const moveCardBetweenListsSchema = z.object({
  cardId: z.string().min(1, 'Card ID không được để trống'),
  sourceListId: z.string().min(1, 'Source List ID không được để trống'),
  targetListId: z.string().min(1, 'Target List ID không được để trống'),
  newPosition: z.number().min(0, 'Vị trí phải lớn hơn hoặc bằng 0'),
  slug: z.string().min(1, 'Slug không được để trống')
})

export type CreateCardSchema = z.infer<typeof createCardSchema>
export type MoveCardWithinListSchema = z.infer<typeof moveCardWithinListSchema>
export type MoveCardBetweenListsSchema = z.infer<typeof moveCardBetweenListsSchema>
