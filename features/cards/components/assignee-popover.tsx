'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { getBoardUsers } from '@/features/boards/queries'
import { useMe } from '@/hooks/use-me'
import { UIUser } from '@/prisma/queries/user'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { X } from 'lucide-react'
import React, { useState } from 'react'
import { useToggleAssignCard } from '../hooks/use-toggle-assign-card'
import { toggleAssignCardQueries } from '../utils'

interface AssigneePopoverProps {
  boardSlug: string
  cardSlug: string
  assignees: UIUser[]
  children: React.ReactNode
}

export default function AssigneePopover({ boardSlug, cardSlug, assignees, children }: AssigneePopoverProps) {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()

  const { toggleAssignCardAction } = useToggleAssignCard(boardSlug, cardSlug)

  const { data: me } = useMe()

  const { data: users } = useQuery({
    queryKey: ['board', 'users', boardSlug],
    queryFn: () => getBoardUsers(boardSlug)
  })

  const boardUsers = users?.filter((user) => !assignees.some((assignee) => assignee.id === user.id)) || []

  const toggleAssignee = ({ targetUser, isAssigned }: { targetUser: UIUser; isAssigned: boolean }) => {
    if (!me) return

    toggleAssignCardQueries({
      queryClient,
      boardSlug,
      cardSlug,
      isAssigned,
      targetUser,
      actorUser: {
        id: me.id,
        fullName: me.fullName,
        email: me.email,
        imageUrl: me.imageUrl
      }
    })

    toggleAssignCardAction.execute({
      cardSlug,
      boardSlug,
      targetId: targetUser.id
    })
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent side='bottom' align='start' className='p-2 w-80'>
        <div className='flex items-center w-full pb-2'>
          <div className='flex-1' />
          <p className='font-semibold text-sm text-center text-muted-foreground'>Thành viên</p>
          <div className='flex-1 flex justify-end'>
            <Button variant='ghost' size='icon' onClick={() => setOpen(false)}>
              <X className='size-4' />
            </Button>
          </div>
        </div>
        <Input className='w-full' placeholder='Tìm kiếm các thành viên' />

        {assignees.length > 0 ? (
          <div className='space-y-1 mt-4'>
            <p className='font-semibold text-xs text-foreground/80'>Thành viên của thẻ</p>

            <div>
              {assignees?.map((user) => (
                <div
                  key={user.id}
                  className='flex items-center gap-2 hover:bg-muted p-1 rounded-sm cursor-pointer'
                  onClick={() =>
                    toggleAssignee({
                      targetUser: {
                        id: user.id,
                        fullName: user.fullName,
                        email: user.email,
                        imageUrl: user.imageUrl
                      },
                      isAssigned: true
                    })
                  }
                >
                  <Avatar>
                    <AvatarImage src={user.imageUrl || undefined} />
                    <AvatarFallback>{user.fullName?.[0]}</AvatarFallback>
                  </Avatar>
                  <p className='text-sm flex-1'>{user.fullName}</p>
                  <X className='size-4 mr-2' />
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {boardUsers?.length > 0 ? (
          <div className='space-y-1 mt-4'>
            <p className='font-semibold text-xs text-foreground/80'>Thành viên của bảng</p>

            <div>
              {boardUsers?.map((user) => (
                <div
                  key={user.id}
                  className='flex items-center gap-2 hover:bg-muted p-1 rounded-sm cursor-pointer'
                  onClick={() =>
                    toggleAssignee({
                      targetUser: {
                        id: user.id,
                        fullName: user.fullName,
                        email: user.email,
                        imageUrl: user.imageUrl
                      },
                      isAssigned: false
                    })
                  }
                >
                  <Avatar>
                    <AvatarImage src={user.imageUrl || undefined} />
                    <AvatarFallback>{user.fullName?.[0]}</AvatarFallback>
                  </Avatar>
                  <p className='text-sm flex-1'>{user.fullName}</p>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  )
}
