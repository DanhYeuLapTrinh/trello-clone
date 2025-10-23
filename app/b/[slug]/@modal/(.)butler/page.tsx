import { getBoardLists } from '@/features/boards/actions'
import BoardButlerDialog from '@/features/butlers/components/board-butler-dialog'
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query'

export default async function InterceptedBoardButlerPage({ params }: { params: { slug: string } }) {
  const queryClient = new QueryClient()
  const { slug } = await params

  await queryClient.prefetchQuery({
    queryKey: ['board', 'lists', slug],
    queryFn: () => getBoardLists(slug)
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <BoardButlerDialog isOpen boardSlug={slug} />
    </HydrationBoundary>
  )
}
