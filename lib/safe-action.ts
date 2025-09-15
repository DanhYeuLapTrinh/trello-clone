import prisma from '@/prisma/prisma'
import { AppError, NotFoundError, UnauthorizedError } from '@/types/error'
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
    throw new UnauthorizedError('Please sign in to continue')
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: userId }
  })

  if (!user) {
    throw new NotFoundError('User not found')
  }

  return next({
    ctx: {
      ...ctx,
      currentUser: user
    }
  })
})

export { protectedActionClient, publicActionClient }
