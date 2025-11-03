'use server'

import clerkService from '@/services/clerk.service'
import { UnauthorizedError } from '@/shared/error'
import { auth } from '@clerk/nextjs/server'

export const getMe = async () => {
  try {
    const { userId } = await auth()

    if (!userId) {
      throw new UnauthorizedError('No user ID found')
    }

    const user = await clerkService.ensureUserExists(userId)

    return user
  } catch (error) {
    throw error
  }
}
