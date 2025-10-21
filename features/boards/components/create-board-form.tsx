import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { boardBackgroundClasses, boardVisibility } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { BoardBackground, BoardVisibility } from '@prisma/client'
import { Check } from 'lucide-react'
import { createElement } from 'react'
import { useFormContext } from 'react-hook-form'
import { CreateBoardSchema } from '../validations'

const boardBackgroundValues = Object.keys(BoardBackground).filter((key) =>
  isNaN(Number(key))
) as (keyof typeof BoardBackground)[]

const boardVisibilityValues = Object.keys(BoardVisibility).filter((key) =>
  isNaN(Number(key))
) as (keyof typeof BoardVisibility)[]

export default function CreateBoardForm() {
  const { control } = useFormContext<CreateBoardSchema>()

  return (
    <div className='space-y-4 mb-4'>
      <FormField
        control={control}
        name='background'
        render={({ field }) => (
          <FormItem>
            <FormLabel>Phông nền</FormLabel>
            <FormControl>
              <div className='grid grid-cols-5 gap-3'>
                {boardBackgroundValues.map((bg) => (
                  <div
                    key={bg}
                    className={cn(
                      'rounded-md cursor-pointer h-12 w-full flex justify-center items-center',
                      boardBackgroundClasses[bg as keyof typeof boardBackgroundClasses]
                    )}
                    onClick={() => field.onChange(bg)}
                  >
                    {field.value === bg ? <Check className='size-5 text-white' /> : null}
                  </div>
                ))}
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name='name'
        render={({ field }) => (
          <FormItem>
            <FormLabel>Tiêu đề bảng*</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name='visibility'
        render={({ field }) => (
          <FormItem>
            <FormLabel>Quyền xem</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder='Chọn quyền xem' />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {boardVisibilityValues.map((visibility) => (
                  <SelectItem key={visibility} value={visibility}>
                    <div className='flex items-center gap-2.5'>
                      {createElement(boardVisibility[visibility as keyof typeof boardVisibility].icon, {
                        className: 'size-4'
                      })}
                      {boardVisibility[visibility as keyof typeof boardVisibility].title}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormDescription>
              {boardVisibility[field.value as keyof typeof boardVisibility].description}
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}
