'use client'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { SubtaskDetail } from '@/types/common'
import { useQueryClient } from '@tanstack/react-query'
import { SquareCheckBig } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useDeleteSubtask } from '../hooks/use-delete-subtask'
import { useUpdateSubtask } from '../hooks/use-update-subtask'
import { removeSubtaskFromCard, toggleSubtaskStatus } from '../utils'
import CreateSubtaskButton from './create-subtask-button'
import SubtaskActions from './subtask-actions'

interface SubtaskSectionProps {
  subtasks: SubtaskDetail[]
  boardSlug: string
  cardSlug: string
  openParentId: string | null
  setOpenParentId: (id: string | null) => void
}

export default function SubtaskSection({
  subtasks,
  boardSlug,
  cardSlug,
  openParentId,
  setOpenParentId
}: SubtaskSectionProps) {
  const queryClient = useQueryClient()
  const [isHiddenDone, setIsHiddenDone] = useState<Record<string, boolean>>({})

  const { updateTaskStatusDebounced } = useUpdateSubtask(boardSlug, cardSlug)
  const { deleteSubtaskAction } = useDeleteSubtask(boardSlug, cardSlug)

  useEffect(() => {
    setIsHiddenDone(
      subtasks.reduce(
        (acc, subtask) => {
          acc[subtask.id] = false
          return acc
        },
        {} as Record<string, boolean>
      )
    )
  }, [subtasks])

  const handleHiddenDone = (parentId: string) => {
    setIsHiddenDone((prev) => ({
      ...prev,
      [parentId]: !prev[parentId]
    }))
  }

  const handleDeleteSubtask = (subtaskId: string) => {
    removeSubtaskFromCard(queryClient, boardSlug, cardSlug, subtaskId)
    deleteSubtaskAction.execute({
      boardSlug,
      cardSlug,
      subtaskId
    })
  }

  const handleToggleSubtask = (childrenId: string, checked: boolean) => {
    // Perform optimistic updates to the query cache for immediate UI feedback
    toggleSubtaskStatus(queryClient, boardSlug, cardSlug, childrenId, checked)
    // Then send the update to the server with debounce
    updateTaskStatusDebounced(childrenId, checked)
  }

  return (
    <>
      {subtasks.map((subtask) => {
        const done = subtask.children.filter((child) => child.isDone).length
        const total = subtask.children.length
        const progress = total > 0 ? (done / total) * 100 : 0

        const visibleChildren = isHiddenDone[subtask.id]
          ? subtask.children.filter((child) => !child.isDone)
          : subtask.children

        return (
          <div className='flex items-start gap-2 mt-6 mb-10' key={subtask.id}>
            <div className='space-y-3.5 mt-1.5 w-9'>
              <SquareCheckBig className='size-5 stroke-[2.5]' />
              <p className='text-xs text-muted-foreground'>{progress.toFixed(0)}%</p>
            </div>

            <div className='space-y-3 w-full'>
              {/* Parent */}
              <div className='flex items-center justify-between'>
                <p className='text-sm font-bold'>{subtask.title}</p>
                <div className='flex items-center gap-2'>
                  {done >= 1 ? (
                    isHiddenDone[subtask.id] ? (
                      <Button size='sm' variant='secondary' onClick={() => handleHiddenDone(subtask.id)}>
                        Hiển thị các mục đã chọn ({done})
                      </Button>
                    ) : (
                      <Button size='sm' variant='secondary' onClick={() => handleHiddenDone(subtask.id)}>
                        Ẩn các mục đã chọn
                      </Button>
                    )
                  ) : null}
                  <Button size='sm' variant='secondary' onClick={() => handleDeleteSubtask(subtask.id)}>
                    Xóa
                  </Button>
                </div>
              </div>

              <div className='mb-4'>
                <Progress value={progress} className='mb-2' />

                {/* Children */}
                {visibleChildren.length === 0 && subtask.children.length > 0 ? (
                  <p className='text-sm text-muted-foreground'>
                    Mọi thứ trong danh sách công việc này đều đã hoàn tất!
                  </p>
                ) : (
                  visibleChildren.map((children) => (
                    <div key={children.id} className='flex items-center gap-1'>
                      <Checkbox
                        checked={children.isDone}
                        onCheckedChange={(checked) => {
                          handleToggleSubtask(children.id, Boolean(checked))
                        }}
                      />
                      <div className='flex-1 justify-between flex items-center hover:bg-muted px-3 py-2 rounded-sm cursor-pointer group'>
                        <p className={cn('text-sm transition-opacity', children.isDone && 'line-through')}>
                          {children.title}
                        </p>
                        <SubtaskActions boardSlug={boardSlug} cardSlug={cardSlug} subtaskId={children.id} />
                      </div>
                    </div>
                  ))
                )}
              </div>

              <CreateSubtaskButton
                boardSlug={boardSlug}
                cardSlug={cardSlug}
                parentId={subtask.id}
                isOpen={openParentId === subtask.id}
                onOpen={() => setOpenParentId(subtask.id)}
                onClose={() => setOpenParentId(null)}
              />
            </div>
          </div>
        )
      })}
    </>
  )
}
