import { getCard } from '@/features/cards/actions'
import CardDetailDialog from '@/features/cards/components/card-detail-dialog'
import { CardDetail } from '@/types/common'
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query'
import { notFound } from 'next/navigation'

export default async function InterceptedCardDetailPage({ params }: { params: { slug: string; cardSlug: string } }) {
  const queryClient = new QueryClient()
  const { slug, cardSlug } = await params

  await queryClient.prefetchQuery({
    queryKey: ['card', slug, cardSlug],
    queryFn: () => getCard(cardSlug)
  })

  const card = queryClient.getQueryData<CardDetail>(['card', slug, cardSlug])

  if (!card) {
    notFound()
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <CardDetailDialog isOpen={true} boardSlug={slug} cardSlug={cardSlug} />
    </HydrationBoundary>
  )
}
