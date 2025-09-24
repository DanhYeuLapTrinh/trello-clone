'use client'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { SubtaskDetail } from '@/types/common'
import { SquareCheckBig } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useUpdateSubtask } from '../../hooks/use-update-subtask'
import CreateSubtaskButton from './create-subtask-button'

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
  const [isHiddenDone, setIsHiddenDone] = useState<Record<string, boolean>>({})

  const { updateTaskStatus, getTaskStatus, isExecuting } = useUpdateSubtask({
    boardSlug,
    cardSlug,
    subtasks
  })

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

  const handleToggleSubtask = (childrenId: string, checked: boolean) => {
    updateTaskStatus(childrenId, checked)
  }

  return (
    <>
      {subtasks.map((subtask) => {
        // Calculate progress using form state for accurate real-time updates
        const done = subtask.children.filter((child) => getTaskStatus(child.id)).length
        const total = subtask.children.length
        const progress = total > 0 ? (done / total) * 100 : 0

        const visibleChildren = isHiddenDone[subtask.id]
          ? subtask.children.filter((child) => !getTaskStatus(child.id))
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
                  <Button size='sm' variant='secondary'>
                    Xóa
                  </Button>
                </div>
              </div>

              <div className='space-y-2 mb-4'>
                <Progress value={progress} />

                {/* Children */}
                {visibleChildren.length === 0 ? (
                  <p className='text-sm text-muted-foreground'>
                    Mọi thứ trong danh sách công việc này đều đã hoàn tất!
                  </p>
                ) : (
                  visibleChildren.map((children) => (
                    <div key={children.id} className='flex items-center gap-2'>
                      <Checkbox
                        checked={getTaskStatus(children.id)}
                        disabled={isExecuting}
                        onCheckedChange={(checked) => {
                          handleToggleSubtask(children.id, Boolean(checked))
                        }}
                      />
                      <p
                        className={cn(
                          'text-sm transition-opacity',
                          getTaskStatus(children.id) && 'line-through',
                          isExecuting && 'opacity-50'
                        )}
                      >
                        {children.title}
                      </p>
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
