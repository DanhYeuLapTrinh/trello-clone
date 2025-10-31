'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useState } from 'react'

// TODO: create action to update board name
export default function BoardNameInput({ name }: { name: string }) {
  const [isEditName, setIsEditName] = useState(false)
  const [newName, setNewName] = useState(name)

  const toggleEditName = () => {
    setIsEditName((prev) => !prev)
  }

  if (isEditName) {
    return (
      <Input
        value={newName}
        onChange={(e) => setNewName(e.target.value)}
        onBlur={toggleEditName}
        autoFocus
        className='text-white font-bold w-auto'
      />
    )
  } else {
    return (
      <Button variant='ghost' className='hover:bg-muted/20' onClick={toggleEditName}>
        <p className='font-bold text-background'>{name}</p>
      </Button>
    )
  }
}
