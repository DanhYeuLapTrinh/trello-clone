'use client'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Checkbox } from '@/components/ui/checkbox'
import { Form, FormField, FormItem } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cardReminderTypes } from '@/shared/constants'
import { cn } from '@/shared/utils'
import { CardReminderType } from '@prisma/client'
import { useQueryClient } from '@tanstack/react-query'
import { addDays, format, parse } from 'date-fns'
import { X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { SubmitHandler } from 'react-hook-form'
import { useDeleteCardDate } from '../hooks/use-delete-card-date'
import { useUpdateCardDate } from '../hooks/use-update-card-date'
import { deleteCardDateQueries, updateCardDateQueries } from '../utils'
import { UpdateCardDateInputSchema } from '../validations'

interface DatePopoverProps {
  reminderType: CardReminderType
  cardStartDate: Date | null
  cardEndDate: Date | null
  cardSlug: string
  boardSlug: string
  children: React.ReactNode
}

const dateFormat = 'MM/dd/yyyy'
const defaultStartDate = format(new Date(), dateFormat)
const defaultEndDate = format(addDays(new Date(), 1), dateFormat)
const defaultEndTime = format(new Date(), 'H:mm')

export default function DatePopover({
  cardStartDate,
  cardEndDate,
  reminderType,
  cardSlug,
  boardSlug,
  children
}: DatePopoverProps) {
  const queryClient = useQueryClient()

  const [open, setOpen] = useState(false)

  const { methods, updateCardAction } = useUpdateCardDate({
    boardSlug,
    cardSlug,
    defaultValues: {
      startDate: cardStartDate ? format(cardStartDate, dateFormat) : undefined,
      endDate: cardEndDate ? format(cardEndDate, dateFormat) : defaultEndDate,
      endTime: cardEndDate ? format(cardEndDate, 'H:mm') : defaultEndTime,
      reminderType,
      cardSlug,
      boardSlug
    }
  })

  const { deleteCardDateAction } = useDeleteCardDate(boardSlug, cardSlug)

  const {
    setValue,
    watch,
    handleSubmit,
    control,
    formState: { errors }
  } = methods
  const { startDate, endDate, endTime } = watch()

  const dateRange = useMemo(() => {
    if (startDate && endDate)
      return { from: parse(startDate, dateFormat, new Date()), to: parse(endDate, dateFormat, new Date()) }
    if (endDate) return { from: undefined, to: parse(endDate, dateFormat, new Date()) }
    if (startDate) return { from: parse(startDate, dateFormat, new Date()), to: undefined }

    return { from: undefined, to: undefined }
  }, [startDate, endDate])

  const isDateRange = !!(startDate && endDate && endTime)

  const toggleStartDate = () => {
    setValue('startDate', startDate ? undefined : cardStartDate ? format(cardStartDate, dateFormat) : defaultStartDate)
  }

  const toggleEndDate = () => {
    setValue('endDate', endDate ? undefined : cardEndDate ? format(cardEndDate, dateFormat) : defaultEndDate)
    setValue('endTime', endTime ? undefined : cardEndDate ? format(cardEndDate, 'H:mm') : defaultEndTime)
  }

  const onSubmit: SubmitHandler<UpdateCardDateInputSchema> = (data) => {
    updateCardDateQueries({ queryClient, boardSlug, cardSlug, data, dateFormat })

    setOpen(false)
    updateCardAction.execute(data)
  }

  const handleDelete = () => {
    deleteCardDateQueries({ queryClient, boardSlug, cardSlug })

    setOpen(false)
    deleteCardDateAction.execute({
      boardSlug,
      cardSlug
    })
  }

  return (
    <Popover modal open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent side='bottom' align='start' className='p-0'>
        <div className='flex items-center w-full px-2 pt-2'>
          <div className='flex-1' />
          <p className='font-semibold text-sm text-center text-muted-foreground'>Ngày</p>
          <div className='flex-1 flex justify-end'>
            <Button variant='ghost' size='icon' onClick={() => setOpen(false)}>
              <X className='size-4' />
            </Button>
          </div>
        </div>

        <div className='min-h-96 max-h-[495px] p-2 overflow-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden'>
          {isDateRange ? (
            <Calendar
              mode='range'
              defaultMonth={dateRange?.to || dateRange?.from}
              selected={dateRange}
              onSelect={(range) => {
                setValue('startDate', range?.from ? format(range.from, dateFormat) : undefined)
                setValue('endDate', range?.to ? format(range.to, dateFormat) : undefined)
                setValue('endTime', format(new Date(), 'H:mm'))
              }}
              captionLayout='dropdown'
              className='w-full px-0'
            />
          ) : (
            <Calendar
              mode='single'
              defaultMonth={dateRange?.to || dateRange?.from}
              selected={dateRange?.from || dateRange?.to}
              onSelect={(date) => {
                if (dateRange?.from) {
                  setValue('startDate', date ? format(date, dateFormat) : undefined)
                  setValue('endDate', undefined)
                  setValue('endTime', undefined)
                } else {
                  setValue('startDate', undefined)
                  setValue('endDate', date ? format(date, dateFormat) : undefined)
                  setValue('endTime', format(new Date(), 'H:mm'))
                }
              }}
              captionLayout='dropdown'
              className='w-full px-0'
            />
          )}

          <div className='space-y-2'>
            <Form {...methods}>
              <div>
                <p className='font-semibold text-xs py-1'>Ngày bắt đầu</p>
                <div className='flex items-center gap-2'>
                  <Checkbox checked={!!startDate} onClick={toggleStartDate} />
                  <Input
                    className='w-28'
                    value={startDate || 'N/T/NNNN'}
                    disabled={!startDate}
                    readOnly={!!startDate}
                  />
                </div>
              </div>

              <div>
                <p className='font-semibold text-xs py-1'>Ngày hết hạn</p>
                <div className='flex items-center gap-2'>
                  <Checkbox checked={!!(endDate && endTime)} onClick={toggleEndDate} />
                  <Input className='w-28' value={endDate || 'N/T/NNNN'} disabled={!endDate} readOnly={!!endDate} />
                  <Input className='w-28' value={endTime || 'H:mm'} disabled={!endTime} readOnly={!!endTime} />
                </div>
              </div>

              <div>
                <p className='font-semibold text-xs py-1'>Thiết lập Nhắc nhở</p>
                <FormField
                  control={control}
                  name='reminderType'
                  render={({ field }) => (
                    <FormItem>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger
                          className={cn('w-full', errors.reminderType?.message ? 'ring ring-rose-500' : '')}
                        >
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
                    </FormItem>
                  )}
                />

                <p className='text-xs text-muted-foreground my-2'>
                  Nhắc nhở sẽ được gửi đến tất cả các thành viên và người theo dõi thẻ này.
                </p>
              </div>

              <Button className='w-full' onClick={handleSubmit(onSubmit)}>
                Lưu
              </Button>
              <Button className='w-full' variant='secondary' onClick={handleDelete}>
                Gỡ bỏ
              </Button>
            </Form>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
