import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button, buttonVariants } from '@/components/ui/button'
import { AvatarGroup, AvatarGroupTooltip } from '@/components/ui/shadcn-io/avatar-group'
import BoardContent from '@/features/boards/components/board-content'
import BoardNameInput from '@/features/boards/components/board-name-input'
import CreateBoardDialog from '@/features/boards/components/create-board-dialog'
import ShareBoardDialog from '@/features/boards/components/share-board-dialog'
import {
  checkBoardPermission,
  getBoardLabels,
  getBoardListsWithCards,
  getBoardOverview,
  getBoardUsers
} from '@/features/boards/queries'
import { BoardUser } from '@/prisma/queries/board'
import { ABLY_CHANNELS, boardBackgroundClasses } from '@/shared/constants'
import { cn } from '@/shared/utils'
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query'
import { Trello, UserPlus, Zap } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function BoardDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const queryClient = new QueryClient()
  const { slug } = await params

  const board = await getBoardOverview(slug)

  if (!board) {
    return notFound()
  }

  const isAdmin = await checkBoardPermission(slug)

  await queryClient.prefetchQuery({
    queryKey: ['board', 'lists', 'cards', slug],
    queryFn: () => getBoardListsWithCards(slug)
  })

  await queryClient.prefetchQuery({
    queryKey: ['board', 'labels', slug],
    queryFn: () => getBoardLabels(slug)
  })

  await queryClient.prefetchQuery({
    queryKey: ['board', 'users', slug],
    queryFn: () => getBoardUsers(slug)
  })

  const boardUsers = queryClient.getQueryData<BoardUser[]>(['board', 'users', slug]) || []

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className={cn('h-screen flex flex-col', boardBackgroundClasses[board.background])}>
        <div className='px-3 py-2 bg-background flex items-center justify-between gap-4 shrink-0'>
          <Link href='/'>
            <Trello className='size-7' />
          </Link>

          <CreateBoardDialog workspaceId={board.workspace.id} asChild>
            <Button>Tạo mới</Button>
          </CreateBoardDialog>
        </div>

        <div className='bg-black/20 backdrop-blur-md px-4 py-3 shadow-lg flex items-center justify-between'>
          <div className='flex-1'>
            <BoardNameInput name={board.name} />
          </div>

          <div className='flex items-center gap-4'>
            <AvatarGroup variant='motion' className='-space-x-2'>
              {boardUsers.map((avatar, index) => (
                <Avatar key={index} className='border-2 border-background cursor-pointer'>
                  <AvatarImage src={avatar.imageUrl || undefined} />
                  <AvatarFallback>{avatar.fullName?.charAt(0)}</AvatarFallback>
                  <AvatarGroupTooltip>
                    <p>{avatar.fullName}</p>
                  </AvatarGroupTooltip>
                </Avatar>
              ))}
            </AvatarGroup>

            {isAdmin ? (
              <div className='space-x-2'>
                <ShareBoardDialog boardSlug={board.slug}>
                  <Button variant='secondary'>
                    <UserPlus />
                    Chia sẻ
                  </Button>
                </ShareBoardDialog>
                <Link
                  href={`/b/${board.slug}/butler`}
                  className={buttonVariants({ variant: 'secondary', size: 'icon' })}
                >
                  <Zap />
                </Link>
              </div>
            ) : null}
          </div>
        </div>

        <BoardContent boardId={board.id} slug={board.slug} channelName={ABLY_CHANNELS.BOARD(board.slug)} />
      </div>
    </HydrationBoundary>
  )
}
