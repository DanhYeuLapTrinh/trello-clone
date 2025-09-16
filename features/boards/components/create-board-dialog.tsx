'use client'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Form } from '@/components/ui/form'
import { Loader2 } from 'lucide-react'
import { SubmitHandler } from 'react-hook-form'
import { useCreateBoard } from '../hooks/use-create-board'
import { CreateBoardSchema } from '../validations'
import CreateBoardForm from './create-board-form'

export default function CreateBoardDialog({
  workspaceId,
  children
}: {
  workspaceId: string
  children: React.ReactNode
}) {
  const { methods, execute, isPending } = useCreateBoard(workspaceId)

  const onSubmit: SubmitHandler<CreateBoardSchema> = (data) => {
    execute(data)
  }

  return (
    <Dialog>
      <DialogTrigger>{children}</DialogTrigger>
      <DialogContent aria-describedby='Tạo bảng'>
        <DialogHeader>
          <DialogTitle className='text-center'>Tạo bảng</DialogTitle>
        </DialogHeader>
        <Form {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)} className='w-full'>
            <CreateBoardForm />
            <DialogFooter>
              <Button type='submit' disabled={isPending}>
                {isPending ? <Loader2 className='size-4 animate-spin' /> : 'Tạo mới'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
