import { cardReminderJob } from '@/lib/jobs/handlers'
import { createHandler } from '@/lib/jobs/utils'
import { Receiver } from '@upstash/qstash'

const currentSigningKey = process.env.QSTASH_CURRENT_SIGNING_KEY
const nextSigningKey = process.env.QSTASH_NEXT_SIGNING_KEY

if (!currentSigningKey || !nextSigningKey) {
  throw new Error(
    'QSTASH signing keys are required. Please set QSTASH_CURRENT_SIGNING_KEY and QSTASH_NEXT_SIGNING_KEY environment variables.'
  )
}

const receiver = new Receiver({
  currentSigningKey,
  nextSigningKey
})

export const { POST } = createHandler({
  receiver,
  jobs: [cardReminderJob]
})
