'use client'

import { Check, ChevronDown } from 'lucide-react'
import * as React from 'react'

import { Button } from '@/components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Option } from '@/features/butlers/types'
import { cn } from '@/lib/utils'

interface ComboboxProps {
  options: Option<string>[]
  placeholder?: string
  value: string
  onChange: (value: string) => void
  error?: boolean
}

export function Combobox({ options, placeholder, value, onChange, error }: ComboboxProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          role='combobox'
          aria-expanded={open}
          className={cn('w-[200px] justify-between', error && 'ring-destructive ring-2 ring-offset-1')}
        >
          <p className='font-normal'>{value ? options.find((option) => option.value === value)?.label : placeholder}</p>
          <ChevronDown className='opacity-50' />
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-[200px] p-0'>
        <Command
          filter={(value, search) => {
            const option = options.find((opt) => opt.value === value)
            if (!option) return 0
            return option.label.toLowerCase().includes(search.toLowerCase()) ? 1 : 0
          }}
        >
          <CommandInput placeholder={placeholder} className='h-9' />
          <CommandList>
            <CommandEmpty>No option found.</CommandEmpty>
            <CommandGroup>
              {options.map((opt) => (
                <CommandItem
                  key={opt.value}
                  value={opt.value}
                  onSelect={(currentValue) => {
                    onChange(currentValue === value ? '' : currentValue)
                    setOpen(false)
                  }}
                >
                  {opt.label}
                  <Check className={cn('ml-auto', value === opt.value ? 'opacity-100' : 'opacity-0')} />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
