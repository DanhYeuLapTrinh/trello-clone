import { getCard } from '@/features/cards/actions'
import CardDetailDialog from '@/features/cards/components/card-detail-dialog'
import { notFound } from 'next/navigation'

export default async function InterceptedCardDetailPage({ params }: { params: { cardSlug: string } }) {
  const { cardSlug } = await params

  const cardDetail = await getCard(cardSlug)

  if (!cardDetail) {
    notFound()
  }

  return <CardDetailDialog isOpen={true} cardDetail={cardDetail} />
}
