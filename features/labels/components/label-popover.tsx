'use client'

import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { getBoardLabels } from '@/features/boards/queries'
import { UILabelDetail } from '@/prisma/queries/label'
import { sortedCardLabelColors } from '@/shared/constants'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, X } from 'lucide-react'
import { useState } from 'react'
import { LabelAction } from '../types'
import ChooseLabelForm from './choose-label-form'
import CreateLabelForm from './create-label-form'
import UpdateLabelForm from './update-label-form'

interface LabelPopoverProps {
  boardSlug: string
  cardSlug: string
  cardLabels: UILabelDetail[]
  children?: React.ReactNode
}

export default function LabelPopover({ boardSlug, cardSlug, cardLabels, children }: LabelPopoverProps) {
  const [open, setOpen] = useState(false)
  const [labelAction, setLabelAction] = useState<LabelAction | null>(null)
  const [isDelete, setIsDelete] = useState(false)

  const { data: boardLabels } = useQuery({
    queryKey: ['board', 'labels', boardSlug],
    queryFn: () => getBoardLabels(boardSlug)
  })

  const displayContent = () => {
    if (labelAction) {
      if (labelAction.action === 'update') {
        return (
          <UpdateLabelForm
            boardSlug={boardSlug}
            cardSlug={cardSlug}
            labelAction={labelAction}
            setLabelAction={setLabelAction}
            isDelete={isDelete}
            setIsDelete={setIsDelete}
          />
        )
      } else {
        return (
          <CreateLabelForm
            boardSlug={boardSlug}
            cardSlug={cardSlug}
            labelAction={labelAction}
            setLabelAction={setLabelAction}
          />
        )
      }
    } else {
      return (
        <ChooseLabelForm
          boardLabels={boardLabels}
          sortedCardLabelColors={sortedCardLabelColors}
          cardLabels={cardLabels}
          boardSlug={boardSlug}
          cardSlug={cardSlug}
          setLabelAction={setLabelAction}
        />
      )
    }
  }

  const handleClose = () => {
    setOpen(false)
    setTimeout(() => {
      setLabelAction(null)
    }, 100)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent side='bottom' align='start' className='p-0 w-[304px]'>
        <div className='flex items-center w-full p-2'>
          {labelAction ? (
            <div className='flex-1 flex justify-start'>
              <Button
                variant='ghost'
                size='icon'
                onClick={() => {
                  if (isDelete) {
                    setIsDelete(false)
                  } else {
                    setLabelAction(null)
                  }
                }}
              >
                <ChevronLeft className='size-4' />
              </Button>
            </div>
          ) : (
            <div className='flex-1' />
          )}
          <p className='font-semibold text-sm text-center text-muted-foreground'>
            {labelAction
              ? labelAction.action === 'create'
                ? 'Tạo nhãn mới'
                : isDelete
                  ? 'Xóa nhãn'
                  : 'Chỉnh sửa nhãn'
              : 'Nhãn'}
          </p>
          <div className='flex-1 flex justify-end'>
            <Button variant='ghost' size='icon' onClick={handleClose}>
              <X className='size-4' />
            </Button>
          </div>
        </div>

        {displayContent()}
      </PopoverContent>
    </Popover>
  )
}
