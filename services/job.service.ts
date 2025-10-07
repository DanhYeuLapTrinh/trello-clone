import { DispatchOptions, JobHandler } from '@/types/job'
import { Client, QstashError, type PublishRequest } from '@upstash/qstash'

class JobService {
  private client: Client
  private endpoint: string

  constructor() {
    this.client = new Client({
      token: process.env.QSTASH_TOKEN!
    })
    this.endpoint = process.env.NEXT_PUBLIC_NGROK_ENDPOINT!
  }

  public createJob<T>(key: string, handler: JobHandler<T>) {
    return {
      key,
      handler,
      run: (data: T) => handler(data),
      dispatch: (data: T, options?: DispatchOptions) => this.dispatch(key, data, options)
    }
  }

  public async getJob(messageId: string) {
    try {
      const message = await this.client.messages.get(messageId)
      return message
    } catch (error) {
      if ((error as QstashError)?.message?.includes('not found')) {
        return null
      }
      throw error
    }
  }

  public async safeDeleteJob(messageId: string) {
    try {
      await this.client.messages.delete(messageId)
    } catch (error) {
      if ((error as QstashError)?.message?.includes('not found')) {
        return
      }
      throw error
    }
  }

  private buildRequest<T>(key: string, body: T, options?: DispatchOptions): PublishRequest {
    const baseRequest = {
      body: JSON.stringify({ payload: body }),
      method: 'POST' as const,
      url: `${this.endpoint}/api/jobs?job=${encodeURIComponent(key)}`
    }

    return {
      ...options,
      ...baseRequest
    } as PublishRequest
  }

  private async dispatch<T>(key: string, body: T, options?: DispatchOptions) {
    try {
      const job = this.buildRequest(key, body, options)

      const jobWithRetry = {
        ...job,
        retries: options?.retries ?? 3
      }

      const result = await this.client.publishJSON(jobWithRetry)

      return result
    } catch (error) {
      console.error(`[Job Service] Failed to dispatch job: ${key}`, error)
      throw error
    }
  }
}

const jobService = new JobService()
export default jobService
