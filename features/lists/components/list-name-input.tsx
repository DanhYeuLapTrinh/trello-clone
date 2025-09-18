'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MoreHorizontal } from 'lucide-react'
import { useState } from 'react'

interface ListNameInputProps {
  name: string
}

export default function ListNameInput({ name }: ListNameInputProps) {
  const [isEditingName, setIsEditingName] = useState(false)
  const [newName, setNewName] = useState(name)

  const toggleEditingName = () => {
    setIsEditingName((prev) => !prev)
  }

  return (
    <div className='flex flex-row items-center justify-between gap-2'>
      {isEditingName ? (
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onBlur={toggleEditingName}
          autoFocus
          // prevent dnd
          onMouseDown={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        />
      ) : (
        // FIXME: UI broken when the name is too long and harder to drag
        <Button
          variant='ghost'
          onClick={toggleEditingName}
          className='hover:bg-muted-foreground/20'
          // prevent dnd
          onMouseDown={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <p className='font-medium text-sm'>{name}</p>
        </Button>
      )}

      <Button
        variant='ghost'
        size='icon'
        className='hover:bg-muted-foreground/20'
        // prevent dnd
        onMouseDown={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <MoreHorizontal className='size-4' />
      </Button>
    </div>
  )
}
