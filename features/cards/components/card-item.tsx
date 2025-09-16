import { Card } from '@/components/ui/card'
import { Card as CardType } from '@prisma/client'

interface CardItemProps {
  card: CardType
}

export default function CardItem({ card }: CardItemProps) {
  return (
    <Card className='px-3 py-2 rounded-md'>
      <p className='text-sm'>{card.title}</p>
    </Card>
  )
}
