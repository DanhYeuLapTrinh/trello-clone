import z from 'zod'

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

export const updateLabelSchema = z.object({
  boardSlug: z.string().min(1, 'Slug không được để trống'),
  cardSlug: z.string().min(1, 'Slug không được để trống'),
  labelId: z.uuid(),
  title: z.string().optional(),
  color: z.string().optional()
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

export const deleteLabelSchema = z.object({
  labelId: z.uuid(),
  boardSlug: z.string().min(1, 'Slug không được để trống'),
  cardSlug: z.string().min(1, 'Slug không được để trống')
})

export type CreateLabelSchema = z.infer<typeof createLabelSchema>
export type UpdateLabelSchema = z.infer<typeof updateLabelSchema>
export type AssignLabelSchema = z.infer<typeof assignLabelSchema>
export type UnassignLabelSchema = z.infer<typeof unassignLabelSchema>
export type DeleteLabelSchema = z.infer<typeof deleteLabelSchema>
