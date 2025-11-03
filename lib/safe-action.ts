import clerkService from '@/services/clerk.service'
import { AppError, UnauthorizedError } from '@/shared/error'
import { auth } from '@clerk/nextjs/server'
import { createSafeActionClient } from 'next-safe-action'

const publicActionClient = createSafeActionClient({
  handleServerError: (e) => {
    if (e instanceof AppError) {
      return e.message
    }

    return 'Có lỗi xảy ra. Vui lòng thử lại.'
  }
})

const protectedActionClient = createSafeActionClient({
  handleServerError: (e) => {
    if (e instanceof AppError) {
      return e.message
    }

    return 'Có lỗi xảy ra. Vui lòng thử lại.'
  }
}).use(async ({ ctx, next }) => {
  const { userId } = await auth()

  if (!userId) {
    throw new UnauthorizedError('No user ID found')
  }

  const user = await clerkService.ensureUserExists(userId)

  return next({
    ctx: {
      ...ctx,
      currentUser: user
    }
  })
})

export { protectedActionClient, publicActionClient }
