import { JobMap, RequestHandlerOptions } from '@/types/job'

export async function requestHandler({ request, jobs, receiver }: RequestHandlerOptions): Promise<Response> {
  try {
    const registry: JobMap = new Map()

    // Register the jobs so they can be executed.
    for (const job of jobs) {
      registry.set(job.key, job.handler)
    }

    const url = new URL(request.url)
    const key = url.searchParams.get('job')
    const signature = request.headers.get('Upstash-Signature')

    // Check for signature and key
    if (!signature || !key) {
      return new Response(JSON.stringify({ error: 'Missing signature or key' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const rawBody = await request.text()
    const valid = await receiver.verify({
      signature,
      body: rawBody
    })

    // Make sure this API is called by Upstash
    if (!valid) {
      return new Response(JSON.stringify({ error: 'Invalid signature' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Get the handler.
    const handler = registry.get(key)

    if (!handler) {
      const availableJobs = Array.from(registry.keys())

      return new Response(
        JSON.stringify({
          error: 'Handler not registered',
          availableJobs
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    let parsedPayload: unknown

    try {
      // Upstash UI messages may be plain objects (e.g. { payload: {...} }) if user create it through UI,
      // but programmatic ones (from code) are often stringified JSON (e.g. "{\"payload\":{...}}"). We parse once, and again if needed.
      const firstParse = JSON.parse(rawBody)
      const parsedBody = typeof firstParse === 'string' ? JSON.parse(firstParse) : firstParse
      parsedPayload = parsedBody.payload || parsedBody
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON in request body' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    await handler(parsedPayload)

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    return new Response(
      JSON.stringify({
        error: 'Job execution failed',
        message: errorMessage
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}

export function createHandler({ jobs, receiver }: Omit<RequestHandlerOptions, 'request'>) {
  return {
    POST: async (request: Request): Promise<Response> => {
      return requestHandler({
        request,
        jobs,
        receiver
      })
    }
  }
}
