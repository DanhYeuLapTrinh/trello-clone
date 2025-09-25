import z from 'zod'

export const createSubtaskSchema = z.object({
  title: z.string().min(1, 'Tiêu đề không được để trống'),
  boardSlug: z.string().min(1, 'Slug không được để trống'),
  cardSlug: z.string().min(1, 'Slug không được để trống'),
  parentId: z.uuid().optional()
})

export const updateSingleTaskSchema = z.object({
  boardSlug: z.string().min(1, 'Slug không được để trống'),
  cardSlug: z.string().min(1, 'Slug không được để trống'),
  taskId: z.uuid(),
  isDone: z.boolean()
})

export const deleteSubtaskSchema = z.object({
  boardSlug: z.string().min(1, 'Slug không được để trống'),
  cardSlug: z.string().min(1, 'Slug không được để trống'),
  subtaskId: z.uuid()
})

export type CreateSubtaskSchema = z.infer<typeof createSubtaskSchema>
export type UpdateSingleTaskSchema = z.infer<typeof updateSingleTaskSchema>
export type DeleteSubtaskSchema = z.infer<typeof deleteSubtaskSchema>
