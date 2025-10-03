import jobService from '@/services/job.service'

export const myJob = jobService.createJob('my-job', async (payload: { name: string; message?: string }) => {
  console.log(`[Job] Processing job for: ${payload.name}`)

  if (payload.message) {
    console.log(`[Job] Message: ${payload.message}`)
  }

  // Simulate some work
  await new Promise((resolve) => setTimeout(resolve, 1000))

  console.log(`[Job] Completed job for: ${payload.name}`)
})
