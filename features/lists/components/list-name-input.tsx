'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useState } from 'react'

interface ListNameInputProps {
  name: string
}

export default function ListNameInput({ name }: ListNameInputProps) {
  const [isEditName, setIsEditName] = useState(false)
  const [newName, setNewName] = useState(name)

  const toggleEditName = () => {
    setIsEditName((prev) => !prev)
  }

  return (
    <div className='flex items-center justify-between gap-2'>
      {isEditName ? (
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onBlur={toggleEditName}
          autoFocus
          // prevent dnd
          onMouseDown={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        />
      ) : (
        <Button
          variant='ghost'
          onClick={toggleEditName}
          className='hover:bg-muted-foreground/20 max-w-full'
          // prevent dnd
          onMouseDown={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <p className='font-medium text-sm truncate'>{name}</p>
        </Button>
      )}
    </div>
  )
}
