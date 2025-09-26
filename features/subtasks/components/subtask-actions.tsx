'use client'

import { useQueryClient } from '@tanstack/react-query'
import { PanelTopOpen, X } from 'lucide-react'
import { useDeleteSubtask } from '../hooks/use-delete-subtask'
import { removeChildSubtaskFromCardQueries } from '../utils'

interface SubtaskActionsProps {
  boardSlug: string
  cardSlug: string
  subtaskId: string
}

export default function SubtaskActions({ boardSlug, cardSlug, subtaskId }: SubtaskActionsProps) {
  const queryClient = useQueryClient()
  const { deleteSubtaskAction } = useDeleteSubtask(boardSlug, cardSlug)

  const handleDeleteSubtask = () => {
    removeChildSubtaskFromCardQueries(queryClient, boardSlug, cardSlug, subtaskId)
    deleteSubtaskAction.execute({ boardSlug, cardSlug, subtaskId })
  }

  return (
    <div className='flex items-center gap-3'>
      <PanelTopOpen className='size-4.5 hidden group-hover:flex' />
      <X className='size-4.5 hidden group-hover:flex' onClick={handleDeleteSubtask} />
    </div>
  )
}
