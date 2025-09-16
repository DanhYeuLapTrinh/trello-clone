import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getBoardLists, getBoardWithWorkspace } from '@/features/boards/actions'
import BoardNameInput from '@/features/boards/components/board-name-input'
import CreateBoardDialog from '@/features/boards/components/create-board-dialog'
import CreateListButton from '@/features/lists/components/create-list-button'
import ListItem from '@/features/lists/components/list-item'
import { boardBackgroundClasses } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { Trello } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function BoardDetailPage({ params }: { params: { slug: string } }) {
  const { slug } = await params

  const { workspace, board } = await getBoardWithWorkspace(slug)
  const lists = await getBoardLists(slug)

  if (!board || !workspace) {
    notFound()
  }

  return (
    <div className={cn('h-screen flex flex-col', boardBackgroundClasses[board.background])}>
      <div className='px-3 py-2 bg-background flex flex-row items-center justify-between gap-4 flex-shrink-0'>
        <Link href={`/w/${workspace.shortName}/home`}>
          <Trello className='size-7' />
        </Link>

        <div className='flex flex-row items-center justify-end gap-2 w-full'>
          <Input placeholder='Tìm kiếm' className='w-1/2' />
          <CreateBoardDialog workspaceId={workspace.id} asChild>
            <Button>Tạo mới</Button>
          </CreateBoardDialog>
        </div>
      </div>

      <div className='bg-black/20 backdrop-blur-md px-4 py-3 shadow-lg flex-shrink-0'>
        <BoardNameInput name={board.name} />
      </div>

      <div className='flex-1 p-3 overflow-x-auto overflow-y-hidden'>
        <div className='flex gap-3 min-w-max items-start'>
          {lists.map((list) => (
            <ListItem key={list.id} list={list} slug={board.slug} />
          ))}
          <div className='flex-shrink-0'>
            <CreateListButton boardId={board.id} slug={board.slug} />
          </div>
        </div>
      </div>
    </div>
  )
}
