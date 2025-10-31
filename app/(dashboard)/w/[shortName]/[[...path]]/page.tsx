import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import CreateBoardDialog from '@/features/boards/components/create-board-dialog'
import { getWorkspaceWithBoards } from '@/features/workspaces/actions'
import { boardBackgroundClasses, boardVisibility } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { LockKeyhole, Plus, Trello } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createElement } from 'react'

export default async function WorkspaceDetailPage({ params }: { params: { shortName: string } }) {
  const { shortName } = await params
  const workspace = await getWorkspaceWithBoards(shortName)

  if (!workspace) {
    notFound()
  }

  return (
    <div className='max-w-4xl mx-auto'>
      <div className='px-12 py-10'>
        <div className='flex flex-col gap-2'>
          <div className='flex items-center gap-3'>
            <Avatar className='size-16 rounded-lg'>
              <AvatarImage src={workspace?.imageUrl || undefined} />
              <AvatarFallback className='font-bold text-4xl rounded-lg'>{workspace?.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <p className='font-semibold text-lg'>{workspace?.name}</p>
              <div className='flex items-center gap-1 px-1'>
                <LockKeyhole className='size-3' />
                <p className='text-xs'>Riêng tư</p>
              </div>
            </div>
          </div>
          <p className='text-sm text-muted-foreground'>{workspace?.description}</p>
        </div>
      </div>

      <Separator />

      <div className='px-4 py-6'>
        <div className='flex items-center gap-2 mb-4'>
          <Trello className='size-6' />
          <p className='font-bold'>Các bảng của bạn</p>
        </div>
        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'>
          {workspace?.boards?.map((board) => (
            <Link href={`/b/${board.slug}`} key={board.id} className='h-28 rounded-md shadow-sm'>
              <div className={cn(boardBackgroundClasses[board.background], 'p-8 rounded-t-md h-[70%] relative')}>
                <div className='absolute top-1.5 right-1.5 p-1.5 bg-muted/20 rounded-full'>
                  {createElement(boardVisibility[board.visibility].icon, { className: 'text-white size-4' })}
                </div>
              </div>
              <div className='h-[30%] flex items-center px-2'>
                <p className='text-sm font-medium'>{board.name}</p>
              </div>
            </Link>
          ))}
          <CreateBoardDialog workspaceId={workspace.id}>
            <div className='h-28 border border-border rounded-md border-dashed flex items-center gap-2 justify-center bg-muted/20 cursor-pointer'>
              <Plus className='size-4' />
              <p className='text-sm font-medium'>Tạo bảng mới</p>
            </div>
          </CreateBoardDialog>
        </div>
      </div>
    </div>
  )
}
