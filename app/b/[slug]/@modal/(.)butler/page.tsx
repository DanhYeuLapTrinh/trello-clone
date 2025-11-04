import { checkBoardPermission, getBoardLists } from '@/features/boards/queries'
import BoardButlerDialog from '@/features/butlers/components/board-butler-dialog'
import { getBoardButlers } from '@/features/butlers/queries'
import { ButlerCategory } from '@prisma/client'
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query'
import { notFound } from 'next/navigation'

export default async function InterceptedBoardButlerPage({ params }: { params: { slug: string } }) {
  const queryClient = new QueryClient()
  const { slug } = await params

  const canCreateButler = await checkBoardPermission(slug)

  if (!canCreateButler) {
    return notFound()
  }

  await queryClient.prefetchQuery({
    queryKey: ['board', 'lists', slug],
    queryFn: () => getBoardLists(slug)
  })

  await queryClient.prefetchQuery({
    queryKey: ['board', 'butlers', ButlerCategory.RULE, slug],
    queryFn: () => getBoardButlers(slug, ButlerCategory.RULE)
  })

  await queryClient.prefetchQuery({
    queryKey: ['board', 'butlers', ButlerCategory.SCHEDULED, slug],
    queryFn: () => getBoardButlers(slug, ButlerCategory.SCHEDULED)
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <BoardButlerDialog isOpen boardSlug={slug} />
    </HydrationBoundary>
  )
}
