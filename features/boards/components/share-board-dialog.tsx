'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useMe } from '@/hooks/use-me'
import { ROLE_LABEL } from '@/shared/constants'
import { Role } from '@prisma/client'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { useQuery } from '@tanstack/react-query'
import { Loader2, X } from 'lucide-react'
import { useState } from 'react'
import { SubmitHandler, useFieldArray } from 'react-hook-form'
import { useDebounce } from 'use-debounce'
import { useSearchUsers } from '../hooks/use-search-users'
import { useShareBoard } from '../hooks/use-share-board'
import { getBoardUsers } from '../queries'
import { ShareBoardSchema } from '../validations'

interface ShareBoardDialogProps {
  boardSlug: string
  children: React.ReactNode
}

export default function ShareBoardDialog({ boardSlug, children }: ShareBoardDialogProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [debouncedQuery] = useDebounce(query, 400)

  const { methods, shareBoardAction } = useShareBoard(boardSlug)
  const { control, handleSubmit } = methods

  const { data: result = [], isFetching } = useSearchUsers(debouncedQuery, boardSlug)

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'value'
  })

  const { data: me } = useMe()

  const { data: users } = useQuery({
    queryKey: ['board', 'users', boardSlug],
    queryFn: () => getBoardUsers(boardSlug)
  })

  const isBoardAdmin = users?.some(
    (user) => user.id === me?.id && (user.role === Role.Admin || user.role === Role.Owner)
  )

  const handleSelect = ({ email, fullName, userId }: { email: string; fullName: string; userId: string }) => {
    if (fields.some((user) => user.email === email)) return
    append({ email, fullName, userId })
    setQuery('')
  }

  const onSubmit: SubmitHandler<ShareBoardSchema> = async (data) => {
    await shareBoardAction.executeAsync(data)
    setQuery('')
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent position='tc' showCloseButton={false} size='lg'>
        <VisuallyHidden>
          <DialogHeader>
            <DialogTitle>Chia sẻ bảng thông tin</DialogTitle>
            <DialogDescription>Chia sẻ bảng thông tin với người dùng khác.</DialogDescription>
          </DialogHeader>
        </VisuallyHidden>

        <div className='flex items-center justify-between mb-2'>
          <p className='text-lg'>Chia sẻ bảng</p>
          <X className='size-6 cursor-pointer' onClick={() => setOpen(false)} />
        </div>

        <Form {...methods}>
          <div className='flex items-center gap-2 w-full'>
            <div className='relative flex-1'>
              <Input placeholder='Địa chỉ email hoặc tên' value={query} onChange={(e) => setQuery(e.target.value)} />

              {query && (
                <Card className='w-full max-h-72 overflow-auto absolute top-10 z-10 p-1 rounded-md gap-1'>
                  {isFetching ? (
                    <div className='flex items-center justify-center h-20'>
                      <Loader2 className='size-4 animate-spin text-muted-foreground' />
                    </div>
                  ) : result.length > 0 ? (
                    result.map((user) => (
                      <div
                        key={user.id}
                        className='flex items-center gap-2 p-2 rounded-sm hover:bg-accent cursor-pointer transition-colors'
                        onMouseDown={(e) => {
                          e.preventDefault()
                          handleSelect({ email: user.email, fullName: user.fullName || '', userId: user.id })
                        }}
                      >
                        <Avatar>
                          <AvatarImage src={user.imageUrl || ''} />
                          <AvatarFallback>
                            {user.firstName?.[0]}
                            {user.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className='text-sm font-medium'>{user.fullName}</p>
                          <p className='text-xs text-muted-foreground'>{user.email}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className='flex items-center justify-center h-20 text-sm text-muted-foreground'>
                      Không tìm thấy người dùng nào
                    </div>
                  )}
                </Card>
              )}
            </div>

            <FormField
              control={control}
              name='role'
              render={({ field }) => (
                <FormItem>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='Chọn vai trò' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={Role.Member}>{ROLE_LABEL[Role.Member]}</SelectItem>
                      {isBoardAdmin && <SelectItem value={Role.Admin}>{ROLE_LABEL[Role.Admin]}</SelectItem>}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button onClick={handleSubmit(onSubmit)} disabled={shareBoardAction.isPending}>
              {shareBoardAction.isPending ? <Loader2 className='size-4 animate-spin' /> : 'Chia sẻ'}
            </Button>
          </div>

          {fields.length > 0 ? (
            <>
              <div className='flex flex-row items-center flex-wrap gap-2'>
                {fields.map((user, index) => (
                  <div key={user.id} className='flex items-center gap-1 bg-muted py-0.5 px-1.5 rounded-sm'>
                    <p className='text-sm'>{user.fullName}</p>
                    <X
                      className='size-4 cursor-pointer hover:bg-muted-foreground/30 rounded-sm'
                      onMouseDown={(e) => {
                        e.preventDefault()
                        remove(index)
                      }}
                    />
                  </div>
                ))}
              </div>
              <FormField
                control={control}
                name='description'
                render={({ field }) => (
                  <FormItem>
                    <Textarea
                      placeholder='Hãy tham gia cùng tôi trên Trello Clone và cùng nhau làm việc trên bảng này!'
                      className='resize-none h-24'
                      {...field}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          ) : null}
        </Form>

        <div className='flex flex-col gap-2 mt-4'>
          <p className='text-sm font-semibold text-muted-foreground'>Thành viên của bảng thông tin</p>
          <div className='space-y-4'>
            {users?.map((user) => (
              <div key={user.id} className='flex items-center gap-2'>
                <Avatar>
                  <AvatarImage src={user.imageUrl || ''} />
                  <AvatarFallback>{user.fullName?.[0]}</AvatarFallback>
                </Avatar>
                <div className='flex-1'>
                  <p className='text-sm'>
                    {user.fullName} {user.id === me?.id ? '(bạn)' : null}
                  </p>
                  <p className='text-xs text-muted-foreground'>
                    {user.email} · <span>{ROLE_LABEL[user.role]} Bảng thông tin</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
