import prisma from '@/prisma/prisma'
import { NotFoundError, UnauthorizedError } from '@/types/error'
import { auth } from '@clerk/nextjs/server'
import { createSafeActionClient } from 'next-safe-action'

const publicActionClient = createSafeActionClient()

const protectedActionClient = createSafeActionClient().use(async ({ ctx, next }) => {
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
