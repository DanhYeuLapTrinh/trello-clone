'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { UserRoundPlus, X } from 'lucide-react'
import { useState } from 'react'

export default function AsigneePopover() {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant='outline' size='sm'>
          <UserRoundPlus className='size-3.5' />
          <p className='text-xs'>Thành viên</p>
        </Button>
      </PopoverTrigger>
      <PopoverContent side='bottom' align='start' className='space-y-2 p-2'>
        <div className='flex items-center w-full'>
          <div className='flex-1' />
          <p className='font-semibold text-sm text-center text-muted-foreground'>Thành viên</p>
          <div className='flex-1 flex justify-end'>
            <Button variant='ghost' size='icon' onClick={() => setOpen(false)}>
              <X className='size-4' />
            </Button>
          </div>
        </div>
        <Input className='w-full' placeholder='Tìm kiếm các thành viên' />
        <p className='font-semibold text-xs'>Thành viên của bảng</p>

        <div className='flex items-center gap-2 hover:bg-muted p-2 rounded-sm cursor-pointer'>
          <Avatar>
            <AvatarImage src='https://github.com/shadcn.png' />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
          <p className='text-sm'>Nguyen Danh</p>
        </div>
      </PopoverContent>
    </Popover>
  )
}
