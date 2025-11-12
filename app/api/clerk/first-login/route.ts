import prisma from '@/prisma/prisma'
import { userSelect } from '@/prisma/queries/user'
import clerkService from '@/services/clerk.service'
import { currentUser } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const APP_URL = process.env.APP_URL

export async function GET() {
  try {
    const clerkUser = await currentUser()

    if (!clerkUser) {
      return NextResponse.redirect(`${APP_URL}/auth/sign-in`, 302)
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { clerkId: clerkUser.id },
      select: userSelect
    })

    // Sync user if new
    if (!existingUser) {
      await clerkService.syncUserFromClerk({
        clerkId: clerkUser.id,
        email: clerkUser.emailAddresses[0].emailAddress,
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
        imageUrl: clerkUser.imageUrl
      })
    }

    return NextResponse.redirect(`${APP_URL}`, 302)
  } catch {
    return NextResponse.redirect(`${APP_URL}/auth/sign-in`, 302)
  }
}
