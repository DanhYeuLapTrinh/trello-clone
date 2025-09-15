'use server'

import prisma from '@/prisma/prisma'
import { NotFoundError, UnauthorizedError } from '@/types/error'
import { auth } from '@clerk/nextjs/server'

export const getMe = async () => {
  try {
    const { userId } = await auth()

    if (!userId) {
      throw new UnauthorizedError('Please sign in to continue')
    }

    const user = await prisma.user.findUnique({
      where: {
        clerkId: userId
      }
    })

    if (!user) {
      throw new NotFoundError('User not found')
    }

    return user
  } catch (error) {
    throw error
  }
}
