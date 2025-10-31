/* eslint-disable @typescript-eslint/no-explicit-any */
import type { PublishRequest, Receiver } from '@upstash/qstash'

export type Job = {
  key: string
  handler: JobHandler
}

export type JobHandler<T = any> = (data: T) => Promise<void>

export type JobMap = Map<string, JobHandler>

export type DispatchOptions = Omit<PublishRequest, 'body' | 'url' | 'method'>

export interface RequestHandlerOptions {
  request: Request
  jobs: Job[]
  receiver: Receiver
}
