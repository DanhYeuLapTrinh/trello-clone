'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CircleCheckBig, X } from 'lucide-react'
import { useState } from 'react'

export default function SubtaskPopover() {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant='outline' size='sm'>
          <CircleCheckBig className='size-3.5' />
          <p className='text-xs'>Việc cần làm</p>
        </Button>
      </PopoverTrigger>
      <PopoverContent side='bottom' align='start' className='space-y-2 p-2'>
        <div className='flex items-center w-full'>
          <div className='flex-1' />
          <p className='font-semibold text-sm text-center text-muted-foreground'>Thêm danh sách công việc</p>
          <div className='flex-1 flex justify-end'>
            <Button variant='ghost' size='icon' onClick={() => setOpen(false)}>
              <X className='size-4' />
            </Button>
          </div>
        </div>

        <div>
          <p className='font-semibold text-xs'>Tiêu đề</p>
          <Input className='w-full' defaultValue='Việc cần làm' />
        </div>

        <Button className='w-full'>Thêm</Button>
      </PopoverContent>
    </Popover>
  )
}
