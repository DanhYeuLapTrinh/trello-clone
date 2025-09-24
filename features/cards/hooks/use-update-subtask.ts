'use client'

import { SubtaskDetail } from '@/types/common'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAction } from 'next-safe-action/hooks'
import { useCallback, useEffect, useMemo } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { useDebouncedCallback } from 'use-debounce'
import { updateTask } from '../actions'
import { updateTaskSchema, UpdateTaskSchema } from '../validations'

interface UseUpdateTaskProps {
  boardSlug: string
  cardSlug: string
  subtasks: SubtaskDetail[]
}

export function useUpdateSubtask({ boardSlug, cardSlug, subtasks }: UseUpdateTaskProps) {
  // Initialize form with all children tasks and required fields
  const defaultValues = useMemo(() => {
    const allTasks = subtasks.flatMap((subtask) =>
      subtask.children.map((child) => ({
        taskId: child.id,
        isDone: child.isDone
      }))
    )
    return {
      boardSlug,
      cardSlug,
      tasks: allTasks
    }
  }, [subtasks, boardSlug, cardSlug])

  const methods = useForm<UpdateTaskSchema>({
    resolver: zodResolver(updateTaskSchema),
    defaultValues
  })

  // Update form when subtasks change
  useEffect(() => {
    methods.reset(defaultValues)
  }, [methods, defaultValues])

  const { execute, isExecuting, result } = useAction(updateTask, {
    onError: ({ error }) => {
      toast.error(error.serverError || 'Có lỗi xảy ra khi cập nhật trạng thái việc cần làm')
      methods.reset(defaultValues)
    }
  })

  // Typed submit handler with proper validation
  const onSubmit: SubmitHandler<UpdateTaskSchema> = useCallback(
    (data) => {
      // Only submit tasks that have actually changed
      const changedTasks = data.tasks.filter((task) => {
        const originalTask = defaultValues.tasks.find((t) => t.taskId === task.taskId)
        return originalTask && originalTask.isDone !== task.isDone
      })

      if (changedTasks.length === 0) return

      // Use the validated form data with only changed tasks
      const payload: UpdateTaskSchema = {
        ...data,
        tasks: changedTasks
      }

      execute(payload)
    },
    [execute, defaultValues.tasks]
  )

  // Debounced submit function using handleSubmit for proper validation
  const debouncedSubmit = useDebouncedCallback(methods.handleSubmit(onSubmit), 2000)

  // Watch form changes and trigger debounced submit
  useEffect(() => {
    const subscription = methods.watch(() => {
      debouncedSubmit()
    })

    return () => subscription.unsubscribe()
  }, [methods, debouncedSubmit])

  // Watch form changes for reactive updates
  const watchedTasks = methods.watch('tasks')

  const updateTaskStatus = useCallback(
    (taskId: string, isDone: boolean) => {
      const currentTasks = methods.getValues('tasks')
      const taskIndex = currentTasks.findIndex((task) => task.taskId === taskId)
      if (taskIndex !== -1) {
        methods.setValue(`tasks.${taskIndex}.isDone`, isDone)
      }
    },
    [methods]
  )

  // Get current task status from form - using watched values for instant updates
  const getTaskStatus = useCallback(
    (taskId: string) => {
      if (!watchedTasks) return false
      const task = watchedTasks.find((t) => t.taskId === taskId)
      return task?.isDone ?? false
    },
    [watchedTasks]
  )
  // Check if there are pending changes - reactive to form changes
  const hasPendingChanges = useMemo(() => {
    if (!watchedTasks || watchedTasks.length === 0) return false

    return watchedTasks.some((task) => {
      const originalTask = defaultValues.tasks.find((t) => t.taskId === task.taskId)
      return originalTask && originalTask.isDone !== task.isDone
    })
  }, [watchedTasks, defaultValues.tasks])

  return {
    methods,
    updateTaskStatus,
    getTaskStatus,
    isExecuting,
    result,
    hasPendingChanges,
    formState: methods.formState,
    // Expose validation errors
    errors: methods.formState.errors,
    isValid: methods.formState.isValid
  }
}
