'use client'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { Bot, CalendarDays, Settings2, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { AutomationCategory } from '../types'
import RulesTab from './rules-tab'

interface BoardButlerDialogProps {
  isOpen: boolean
  boardSlug: string
}

export default function BoardButlerDialog({ isOpen, boardSlug }: BoardButlerDialogProps) {
  const router = useRouter()

  const [open, setOpen] = useState(isOpen)
  const [tabValue, setTabValue] = useState<AutomationCategory>('rule')

  const handleOpenChange = (open: boolean) => {
    setOpen(open)
    if (!open) {
      router.back()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        className='p-0 gap-0 overflow-auto'
        position='tc'
        size='fullScreen'
        aria-describedby='board-butler-dialog'
      >
        <VisuallyHidden>
          <DialogHeader>
            <DialogTitle>Board Butler</DialogTitle>
            <DialogDescription>...</DialogDescription>
          </DialogHeader>
        </VisuallyHidden>

        <div className='grid grid-cols-12 h-[calc(100vh-3rem)] overflow-auto'>
          <div className='col-span-2 bg-muted px-2 py-4'>
            <div className='flex items-center gap-2 mb-12'>
              <Bot className='size-7 text-primary' />
              <p className='text-xl font-semibold text-primary'>Automation</p>
            </div>

            <div className='space-y-2'>
              <Button
                className={cn(
                  'w-full justify-start hover:bg-primary/10 hover:text-primary',
                  tabValue === 'rule' && 'bg-primary/10 text-primary'
                )}
                variant='ghost'
                onClick={() => setTabValue('rule')}
              >
                <Settings2 className='size-5' />
                <p>Rules</p>
              </Button>

              <Button
                className={cn(
                  'w-full justify-start hover:bg-primary/10 hover:text-primary',
                  tabValue === 'scheduled' && 'bg-primary/10 text-primary'
                )}
                variant='ghost'
                onClick={() => setTabValue('scheduled')}
              >
                <CalendarDays className='size-5' />
                <p>Scheduled</p>
              </Button>
            </div>
          </div>

          <div className='col-span-10 xl:w-5xl xl:mx-auto p-10 relative'>
            {tabValue === 'rule' && <RulesTab boardSlug={boardSlug} />}

            <X className='absolute top-2 right-2 cursor-pointer' onClick={() => handleOpenChange(false)} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
