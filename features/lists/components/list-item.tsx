import Draggable from '@/components/dnd/draggable'
import Droppable from '@/components/dnd/droppable'
import CardItem from '@/features/cards/components/card-item'
import { Card as CardType, List } from '@prisma/client'
import ListNameInput from './list-name-input'

interface ListItemProps {
  list: List & { cards: CardType[] }
}

export default function ListItem({ list }: ListItemProps) {
  const cards = list.cards

  return (
    <Droppable
      id={`list>${list.id}>${list.name}`}
      data={{
        type: 'list',
        listId: list.id,
        listName: list.name
      }}
      className='flex flex-col gap-2'
    >
      <ListNameInput name={list.name} />

      {cards.map((card) => (
        <div key={card.id}>
          <Droppable
            id={`card>${card.id}`}
            data={{
              type: 'card',
              cardId: card.id,
              cardName: card.title,
              listId: list.id,
              listName: list.name
            }}
          >
            <Draggable
              id={`card>${card.id}`}
              data={{
                type: 'card',
                cardId: card.id,
                cardName: card.title,
                listId: list.id,
                listName: list.name
              }}
            >
              <CardItem card={card} />
            </Draggable>
          </Droppable>
        </div>
      ))}
    </Droppable>
  )
}
