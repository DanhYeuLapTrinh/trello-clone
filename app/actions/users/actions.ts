'use server'

import prisma from '@/prisma/prisma'
import { NotFoundError, UnauthorizedError } from '@/types/error'
import { auth } from '@clerk/nextjs/server'

export const getMe = async () => {
  try {
    const { userId } = await auth()

    if (!userId) {
      throw new UnauthorizedError('No user ID found')
    }

    const user = await prisma.user.findUnique({
      where: {
        clerkId: userId
      }
    })

    if (!user) {
      throw new NotFoundError('User')
    }

    return user
  } catch (error) {
    throw error
  }
}
