import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { UIList } from '@/types/ui'
import { Butler, User } from '@prisma/client'
import { formatDistanceToNow } from 'date-fns'
import { Copy, Lightbulb, Pencil, Trash2 } from 'lucide-react'
import { ButlerData } from '../types'
import { transformToReadableString } from '../utils'

interface ButlerCardProps {
  rule: Butler & { creator: User }
  lists: UIList[]
}

export default function ButlerCard({ rule, lists }: ButlerCardProps) {
  const details = rule.details as ButlerData | null
  if (!details) return null

  return (
    <Card key={rule.id} className='p-4 rounded-md gap-3'>
      <div className='flex items-center gap-2 mb-2'>
        <div className='flex items-center gap-4 flex-1'>
          <Pencil className='size-4 text-foreground/80' />
          <Copy className='size-4 text-foreground/80' />
          <Trash2 className='size-4 text-foreground/80' />
          <Lightbulb className='size-4 text-foreground/80' />
        </div>
        <p className='text-xs text-muted-foreground italic pr-4'>
          last modified {formatDistanceToNow(rule.updatedAt, { addSuffix: true })}
        </p>
      </div>
      <p className='p-3 font-code bg-muted rounded-sm text-sm'>
        {transformToReadableString(
          details.trigger,
          details.actions,
          lists.reduce(
            (acc, list) => {
              acc[list.id] = list.name
              return acc
            },
            {} as Record<string, string>
          ),
          rule.creator?.fullName || rule.creator?.email || 'Unknown User'
        )}
      </p>

      <div className='flex items-center justify-between gap-2 mt-1 mb-2'>
        <RadioGroup defaultValue={rule.isEnabled ? 'enable' : 'disable'} className='flex items-center gap-6'>
          <div className='flex items-center space-x-1.5'>
            <RadioGroupItem value='enable' id='enable' />
            <Label htmlFor='enable' className='font-normal text-sm'>
              Enable automation on board
            </Label>
          </div>
          <div className='flex items-center space-x-1.5'>
            <RadioGroupItem value='disable' id='disable' />
            <Label htmlFor='disable' className='font-normal text-sm'>
              Disable automation on board
            </Label>
          </div>
        </RadioGroup>

        <Avatar className='size-8'>
          <AvatarImage src={rule.creator?.imageUrl || undefined} />
          <AvatarFallback>{rule.creator?.fullName?.charAt(0) || ''}</AvatarFallback>
        </Avatar>
      </div>
    </Card>
  )
}
