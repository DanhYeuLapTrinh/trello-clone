import { getWorkspaceWithBoards } from '@/app/actions/workspaces/actions'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { LockKeyhole, Plus, Trello } from 'lucide-react'
import { notFound } from 'next/navigation'

export default async function WorkspaceDetailPage({ params }: { params: { shortName: string } }) {
  const { shortName } = await params
  const workspace = await getWorkspaceWithBoards(shortName)

  if (!workspace) {
    notFound()
  }

  return (
    <div>
      <div className='px-12 py-10'>
        <div className='flex flex-col gap-2'>
          <div className='flex flex-row items-center gap-3'>
            <Avatar className='size-16 rounded-lg'>
              <AvatarImage src={workspace?.imageUrl || undefined} />
              <AvatarFallback className='font-bold text-4xl rounded-lg'>{workspace?.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <p className='font-semibold text-lg'>{workspace?.name}</p>
              <div className='flex flex-row items-center gap-1 px-1'>
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
        <div className='flex flex-row items-center gap-2 mb-4'>
          <Trello className='size-6' />
          <p className='font-bold'>Các bảng của bạn</p>
        </div>
        <div className='grid grid-cols-4 gap-4'>
          {workspace?.boards?.map((board) => (
            <div key={board.id} className='h-28'>
              <p>{board.name}</p>
            </div>
          ))}
          <Button variant='secondary' className='h-28'>
            <Plus className='size-4' />
            <p>Tạo bảng mới</p>
          </Button>
        </div>
      </div>
    </div>
  )
}
