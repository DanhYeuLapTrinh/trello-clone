'use client'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { Bot, CalendarDays, Settings2 } from 'lucide-react'
import { useState } from 'react'
import { AutomationCategory } from '../types'
import RulesTab from './rules-tab'

interface BoardButlerDialogProps {
  isOpen: boolean
}

export default function BoardButlerDialog({ isOpen }: BoardButlerDialogProps) {
  const [open, setOpen] = useState(isOpen)
  const [tabValue, setTabValue] = useState<AutomationCategory>('rule')

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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

        <div className='grid grid-cols-12'>
          <div className='col-span-2 xl:col-span-1 bg-muted px-2 py-4'>
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

          <div className='col-span-10 xl:col-span-11 p-8'>
            <p className='text-2xl font-semibold'>{tabValue === 'rule' ? 'Rules' : 'Scheduled automations'}</p>
            <Separator className='mt-4 mb-2' />

            {tabValue === 'rule' && <RulesTab />}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
