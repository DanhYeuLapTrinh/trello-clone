'use client'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cardReminderTypes } from '@/lib/constants'
import { format } from 'date-fns'
import { Clock, X } from 'lucide-react'
import { useState } from 'react'

export default function DatePopover() {
  const [open, setOpen] = useState(false)
  const [date, setDate] = useState({ from: undefined as Date | undefined, to: undefined as Date | undefined })

  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [endDate, setEndDate] = useState<Date | undefined>(undefined)
  const [endTime, setEndTime] = useState<string | undefined>(undefined)

  const toggleStartDate = () => setStartDate((prev) => (prev ? undefined : new Date()))
  const toggleEndDate = () => {
    setEndDate((prev) => (prev ? undefined : new Date()))
    setEndTime((prev) => (prev ? undefined : '1:25 PM'))
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant='outline' size='sm'>
          <Clock className='size-3.5' />
          <p className='text-xs'>Ngày</p>
        </Button>
      </PopoverTrigger>
      <PopoverContent side='bottom' align='start' className='p-2'>
        <div className='flex items-center w-full'>
          <div className='flex-1' />
          <p className='font-semibold text-sm text-center text-muted-foreground'>Ngày</p>
          <div className='flex-1 flex justify-end'>
            <Button variant='ghost' size='icon' onClick={() => setOpen(false)}>
              <X className='size-4' />
            </Button>
          </div>
        </div>

        <Calendar
          mode='range'
          defaultMonth={date?.from}
          selected={date}
          onSelect={(range) => setDate({ from: range?.from, to: range?.to })}
          captionLayout='dropdown'
          className='w-full px-0'
        />

        <div className='space-y-2'>
          <div>
            <p className='font-semibold text-xs py-1'>Ngày bắt đầu</p>
            <div className='flex items-center gap-2'>
              <Checkbox onClick={toggleStartDate} />
              <Input
                className='w-fit'
                value={startDate ? format(startDate, 'M/d/yyyy') : 'M/D/YYYY'}
                disabled={!startDate}
              />
            </div>
          </div>

          <div>
            <p className='font-semibold text-xs py-1'>Ngày hết hạn</p>
            <div className='flex items-center gap-2'>
              <Checkbox onClick={toggleEndDate} />
              <Input className='w-fit' value={endDate ? format(endDate, 'M/d/yyyy') : 'M/D/YYYY'} disabled={!endDate} />
              <Input className='w-fit' value={endTime ? endTime : 'h:mm a'} disabled={!endTime} />
            </div>
          </div>

          <div>
            <p className='font-semibold text-xs py-1'>Thiết lập Nhắc nhở</p>
            <Select defaultValue='ONE_DAY_BEFORE'>
              <SelectTrigger className='w-full'>
                <SelectValue placeholder='Chọn thời gian nhắc nhở' />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(cardReminderTypes).map(([key, value]) => (
                  <SelectItem key={key} value={key}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className='text-xs text-muted-foreground my-2'>
              Nhắc nhở sẽ được gửi đến tất cả các thành viên và người theo dõi thẻ này.
            </p>
          </div>

          <Button className='w-full'>Lưu</Button>
          <Button className='w-full' variant='secondary'>
            Gỡ bỏ
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
