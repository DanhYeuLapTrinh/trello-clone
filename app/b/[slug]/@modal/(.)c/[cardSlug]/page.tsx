import CardDetailDialog from '@/features/cards/components/card-detail-dialog'
import { getCard, getCardActivitiesAndComments } from '@/features/cards/queries'
import { CardDetail } from '@/prisma/queries/card'
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

  await queryClient.prefetchQuery({
    queryKey: ['card', 'activities', 'comments', slug, cardSlug],
    queryFn: () => getCardActivitiesAndComments(cardSlug)
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <CardDetailDialog isOpen={true} boardSlug={slug} cardSlug={cardSlug} />
    </HydrationBoundary>
  )
}
