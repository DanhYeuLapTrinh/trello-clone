import { Inngest } from 'inngest'

export const inngest = new Inngest({
  id: 'trello-clone',
  name: 'Trello Clone',
  // Used for production environment
  eventKey: process.env.INNGEST_EVENT_KEY
})
