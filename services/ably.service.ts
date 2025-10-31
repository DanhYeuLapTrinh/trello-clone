import { AblyEventPayload } from '@/lib/constants'
import * as Ably from 'ably'
import 'server-only'

class AblyService {
  private client: Ably.Rest | null = null

  constructor() {
    this.client = new Ably.Rest({
      key: process.env.ABLY_API_KEY as string
    })
  }

  /**
   * Get a stateless channel instance from the Rest client.
   */
  private getChannel(channelName: string): Ably.Channel {
    if (!this.client) {
      throw new Error('Ably not initialized')
    }

    return this.client.channels.get(channelName)
  }

  /**
   * Publish a message to a channel.
   */
  public async publish<T extends keyof AblyEventPayload>(
    channelName: string,
    eventName: T,
    data: AblyEventPayload[T]
  ): Promise<void> {
    try {
      const channel = this.getChannel(channelName)
      await channel.publish(eventName, data)

      console.log(`[Ably] REST client published ${eventName} to ${channelName}`)
    } catch (error) {
      console.error(`[Ably] REST client failed to publish to ${channelName}:`, error)
      throw error
    }
  }
}

const ablyService = new AblyService()
export default ablyService
