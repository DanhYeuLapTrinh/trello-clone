import { Card } from '@/components/ui/card'
import CardItem from '@/features/cards/components/card-item'
import CreateCardButton from '@/features/cards/components/create-card-button'
import { List } from '@prisma/client'
import { getListCards } from '../actions'
import ListNameInput from './list-name-input'

interface ListItemProps {
  list: List
  slug: string
}

export default async function ListItem({ list, slug }: ListItemProps) {
  const cards = await getListCards(list.id)

  return (
    <Card className='w-72 p-2 shadow-sm bg-muted flex flex-col gap-2'>
      <ListNameInput name={list.name} />
      {cards.map((card) => (
        <CardItem key={card.id} card={card} />
      ))}
      <CreateCardButton listId={list.id} slug={slug} />
    </Card>
  )
}
