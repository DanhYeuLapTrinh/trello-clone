'use server'

import prisma from '@/prisma/prisma'
import { UIUser, userSelect } from '@/prisma/queries/user'
import clerkService from '@/services/clerk.service'
import { UnauthorizedError } from '@/shared/error'
import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export const getMe = async (): Promise<UIUser> => {
  const { userId: clerkId } = await auth()

  if (!clerkId) {
    throw new UnauthorizedError('No user ID found')
  }

  // Try to find user in database first
  const user = await prisma.user.findUnique({
    where: {
      clerkId
    },
    select: userSelect
  })

  if (user) {
    return user
  }

  // User doesn't exist in database, sync from Clerk
  const clerkUser = await currentUser()

  if (!clerkUser) {
    redirect('/auth/sign-in')
  }

  // Ensure email exists
  const primaryEmail = clerkUser.emailAddresses.find((email) => email.id === clerkUser.primaryEmailAddressId)
  if (!primaryEmail) {
    throw new UnauthorizedError('No email address found')
  }

  const syncedUser = await clerkService.syncUserFromClerk({
    clerkId: clerkUser.id,
    firstName: clerkUser.firstName,
    lastName: clerkUser.lastName,
    email: primaryEmail.emailAddress,
    imageUrl: clerkUser.imageUrl
  })

  if (!syncedUser) {
    throw new Error('Failed to sync user from Clerk')
  }

  return syncedUser
}
