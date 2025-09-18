import { Card } from '@/components/ui/card'
import CardItem from '@/features/cards/components/card-item'
import CreateCardButton from '@/features/cards/components/create-card-button'
import { ListWithCards } from '@/types/common'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import ListNameInput from './list-name-input'

interface ListItemProps {
  list: ListWithCards
  slug: string
}

export default function ListItem({ list, slug }: ListItemProps) {
  const cards = list.cards

  return (
    <Card className='w-72 p-2 shadow-sm bg-muted flex flex-col gap-2'>
      <ListNameInput name={list.name} />
      <SortableContext items={cards.map((card) => card.id)} strategy={verticalListSortingStrategy}>
        {cards.map((card) => (
          <SortableCardItem key={card.id} id={card.id}>
            <CardItem card={card} />
          </SortableCardItem>
        ))}
      </SortableContext>
      <CreateCardButton listId={list.id} slug={slug} />
    </Card>
  )
}

const SortableCardItem = ({ id, children }: { id: string; children: React.ReactNode }) => {
  const { attributes, listeners, setNodeRef, transition, transform, isDragging } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  )
}
