import { getBoardLists } from '@/features/boards/actions'
import { getBoardButlers } from '@/features/butlers/actions'
import BoardButlerDialog from '@/features/butlers/components/board-butler-dialog'
import { ButlerCategory } from '@prisma/client'
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query'

export default async function InterceptedBoardButlerPage({ params }: { params: { slug: string } }) {
  const queryClient = new QueryClient()
  const { slug } = await params

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
