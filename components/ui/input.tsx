import * as React from 'react'

import { cn } from '@/shared/utils'

interface InputProps extends React.ComponentProps<'input'> {
  startIcon?: React.ReactNode
  endIcon?: React.ReactNode
  onClickStartIcon?: () => void
  onClickEndIcon?: () => void
}

function Input({ className, type, startIcon, endIcon, onClickStartIcon, onClickEndIcon, ...props }: InputProps) {
  if (!startIcon && !endIcon) {
    return (
      <input
        type={type}
        data-slot='input'
        className={cn(
          'file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
          'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
          'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
          className
        )}
        {...props}
      />
    )
  }

  return (
    <div
      className={cn(
        'file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        'focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]',
        'has-[:invalid]:ring-destructive/20 dark:has-[:invalid]:ring-destructive/40 has-[:invalid]:border-destructive',
        className
      )}
    >
      {startIcon && (
        <div
          className={cn(
            'flex items-center justify-center px-3 text-muted-foreground',
            onClickStartIcon && 'cursor-pointer hover:text-foreground'
          )}
          onClick={onClickStartIcon}
        >
          {startIcon}
        </div>
      )}
      <input
        type={type}
        data-slot='input'
        className='flex-1 bg-transparent px-3 py-1 outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50'
        {...props}
      />
      {endIcon && (
        <div
          className={cn(
            'flex items-center justify-center px-3 text-muted-foreground',
            onClickEndIcon && 'cursor-pointer hover:text-foreground'
          )}
          onClick={onClickEndIcon}
        >
          {endIcon}
        </div>
      )}
    </div>
  )
}

export { Input }
