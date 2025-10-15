import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  getBoardLabels,
  getBoardListsWithCards,
  getBoardMembers,
  getBoardOwner,
  getBoardWithWorkspace
} from '@/features/boards/actions'
import BoardContent from '@/features/boards/components/board-content'
import BoardNameInput from '@/features/boards/components/board-name-input'
import CreateBoardDialog from '@/features/boards/components/create-board-dialog'
import ShareBoardDialog from '@/features/boards/components/share-board-dialog'
import { boardBackgroundClasses } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query'
import { Trello, UserPlus } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function BoardDetailPage({ params }: { params: { slug: string } }) {
  const queryClient = new QueryClient()
  const { slug } = await params

  const { workspace, board } = await getBoardWithWorkspace(slug)

  await queryClient.prefetchQuery({
    queryKey: ['board', 'lists', slug],
    queryFn: () => getBoardListsWithCards(slug)
  })

  await queryClient.prefetchQuery({
    queryKey: ['board', 'labels', slug],
    queryFn: () => getBoardLabels(slug)
  })

  await queryClient.prefetchQuery({
    queryKey: ['board', 'members', slug],
    queryFn: () => getBoardMembers(slug)
  })

  await queryClient.prefetchQuery({
    queryKey: ['board', 'owner', slug],
    queryFn: () => getBoardOwner(slug)
  })

  if (!board || !workspace) {
    notFound()
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className={cn('h-screen flex flex-col', boardBackgroundClasses[board.background])}>
        <div className='px-3 py-2 bg-background flex items-center justify-between gap-4 flex-shrink-0'>
          <Link href={`/w/${workspace.shortName}/home`}>
            <Trello className='size-7' />
          </Link>

          <div className='flex items-center justify-end gap-2 w-full'>
            <Input placeholder='Tìm kiếm' className='w-1/2' />
            <CreateBoardDialog workspaceId={workspace.id} asChild>
              <Button>Tạo mới</Button>
            </CreateBoardDialog>
          </div>
        </div>

        <div className='bg-black/20 backdrop-blur-md px-4 py-3 shadow-lg flex items-center justify-between'>
          <BoardNameInput name={board.name} />
          <ShareBoardDialog boardSlug={board.slug}>
            <Button variant='secondary'>
              <UserPlus />
              Chia sẻ
            </Button>
          </ShareBoardDialog>
        </div>

        <BoardContent boardId={board.id} slug={board.slug} />
      </div>
    </HydrationBoundary>
  )
}
