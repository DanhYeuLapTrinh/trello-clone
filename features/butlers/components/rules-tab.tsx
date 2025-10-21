import { Button } from '@/components/ui/button'
import { Bot } from 'lucide-react'

export default function RulesTab() {
  return (
    <div className='grid grid-cols-12 p-4 gap-6'>
      <div className='col-span-6 space-y-4'>
        <p className='text-2xl font-semibold'>
          Rules are simple: when one thing happens, another thing happens automatically
        </p>

        <p>Examples:</p>

        <div className='p-4 space-y-4'>
          <div className='flex items-start gap-3'>
            <Bot className='size-6 text-primary shrink-0' />
            <p>
              When a <span className='font-bold'>card is created in list</span> &quot;To Do&quot; by me,{' '}
              <span className='font-bold'>add the &quot;Steps&quot; checklist.</span>
            </p>
          </div>

          <div className='flex items-start gap-3'>
            <Bot className='size-6 text-primary shrink-0' />
            <p>
              When a <span className='font-bold'>card is moved to list</span> &quot;Done&quot; by anyone,{' '}
              <span className='font-bold'>mark the due date as complete and remove all members from the card.</span>
            </p>
          </div>

          <div className='flex items-start gap-3'>
            <Bot className='size-6 text-primary shrink-0' />
            <p>
              <span className='font-bold'>When I am added to a card, set the due date</span> in 5 working days and{' '}
              <span className='font-bold'>post a comment</span> saying &quot;I got this!&quot;
            </p>
          </div>

          <Button className='mt-2'>
            <p className='font-bold'>Create automation</p>
          </Button>
        </div>
      </div>
      <div className='col-span-6'>
        <iframe
          className='w-full h-60 rounded-md'
          src='https://www.youtube.com/embed/WSMfGoXrL9I?si=-CDgBUXA-fYtMzkQ'
          title='YouTube video player'
          allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'
          referrerPolicy='strict-origin-when-cross-origin'
          allowFullScreen
        ></iframe>
        <p className='text-center text-foreground/90 text-sm mt-4'>Watch a 65-second overview of rules</p>
      </div>
    </div>
  )
}
