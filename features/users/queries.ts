'use server'

import prisma from '@/prisma/prisma'
import { UIUser, userSelect } from '@/prisma/queries/user'
import { NotFoundError, UnauthorizedError } from '@/shared/error'
import { auth } from '@clerk/nextjs/server'

export const getMe = async (): Promise<UIUser> => {
  const { userId: clerkId } = await auth()

  if (!clerkId) {
    throw new UnauthorizedError('No user ID found')
  }

  const user = await prisma.user.findUnique({
    where: {
      clerkId
    },
    select: userSelect
  })

  if (!user) {
    throw new NotFoundError('User')
  }

  return user
}
