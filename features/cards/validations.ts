import z from 'zod'

export const createCardSchema = z.object({
  title: z.string().min(1, 'Tên thẻ không được để trống'),
  slug: z.string().min(1, 'Slug không được để trống'),
  listId: z.uuid()
})

export const moveCardWithinListSchema = z.object({
  cardId: z.uuid(),
  listId: z.uuid(),
  newPosition: z.number().min(0, 'Vị trí phải lớn hơn hoặc bằng 0'),
  slug: z.string().min(1, 'Slug không được để trống')
})

export const moveCardBetweenListsSchema = z.object({
  cardId: z.uuid(),
  sourceListId: z.uuid(),
  targetListId: z.uuid(),
  newPosition: z.number().min(0, 'Vị trí phải lớn hơn hoặc bằng 0'),
  slug: z.string().min(1, 'Slug không được để trống')
})

export const updateCardSchema = z.object({
  cardId: z.uuid(),
  title: z.string().optional(),
  description: z.string().optional(),
  boardSlug: z.string()
})

export const createLabelSchema = z
  .object({
    boardSlug: z.string().min(1, 'Slug không được để trống'),
    cardSlug: z.string().min(1, 'Slug không được để trống'),
    title: z.string().optional(),
    color: z.string().optional()
  })
  .refine((data) => data.title || data.color, {
    message: 'Tiêu đề hoặc màu phải được cung cấp'
  })

export const assignLabelSchema = z.object({
  labelId: z.uuid(),
  boardSlug: z.string().min(1, 'Slug không được để trống'),
  cardSlug: z.string().min(1, 'Slug không được để trống')
})

export const unassignLabelSchema = z.object({
  labelId: z.uuid(),
  boardSlug: z.string().min(1, 'Slug không được để trống'),
  cardSlug: z.string().min(1, 'Slug không được để trống')
})

export const createSubtaskSchema = z.object({
  title: z.string().min(1, 'Tiêu đề không được để trống'),
  boardSlug: z.string().min(1, 'Slug không được để trống'),
  cardSlug: z.string().min(1, 'Slug không được để trống'),
  parentId: z.uuid().optional()
})

export const taskStatusSchema = z.object({
  taskId: z.uuid(),
  isDone: z.boolean()
})

export const updateTaskSchema = z.object({
  boardSlug: z.string().min(1, 'Slug không được để trống'),
  cardSlug: z.string().min(1, 'Slug không được để trống'),
  tasks: z.array(taskStatusSchema).min(1, 'Ít nhất một việc cần làm phải được cung cấp')
})

export type CreateCardSchema = z.infer<typeof createCardSchema>
export type MoveCardWithinListSchema = z.infer<typeof moveCardWithinListSchema>
export type MoveCardBetweenListsSchema = z.infer<typeof moveCardBetweenListsSchema>
export type UpdateCardSchema = z.infer<typeof updateCardSchema>
export type CreateLabelSchema = z.infer<typeof createLabelSchema>
export type AssignLabelSchema = z.infer<typeof assignLabelSchema>
export type UnassignLabelSchema = z.infer<typeof unassignLabelSchema>
export type CreateSubtaskSchema = z.infer<typeof createSubtaskSchema>
export type TaskStatusSchema = z.infer<typeof taskStatusSchema>
export type UpdateTaskSchema = z.infer<typeof updateTaskSchema>
