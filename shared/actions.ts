'use server'

import { protectedActionClient } from '@/lib/safe-action'
import prisma from '@/prisma/prisma'
import { userSelect } from '@/prisma/queries/user'
import clerkService from '@/services/clerk.service'
import firebaseService from '@/services/firebase.service'
import { deleteFileSchema, uploadFilesSchema } from '@/shared/validations'
import { flattenValidationErrors } from 'next-safe-action'
import z from 'zod'

// Upload files
export const uploadFiles = protectedActionClient
  .inputSchema(uploadFilesSchema, {
    handleValidationErrorsShape: async (ve) => flattenValidationErrors(ve).fieldErrors
  })
  .action(async ({ parsedInput }) => {
    try {
      const uploadedFiles = await firebaseService.uploadFiles(parsedInput.files, parsedInput.folder)

      return uploadedFiles
    } catch (error) {
      throw error
    }
  })

// Delete file
export const deleteFile = protectedActionClient
  .inputSchema(deleteFileSchema, {
    handleValidationErrorsShape: async (ve) => flattenValidationErrors(ve).fieldErrors
  })
  .action(async ({ parsedInput }) => {
    try {
      const { filePath, url } = parsedInput

      // If URL is provided, extract file path from it
      let pathToDelete = ''

      if (filePath) {
        pathToDelete = filePath
      } else if (url) {
        pathToDelete = firebaseService.extractFilePathFromUrl(url)
      }

      await firebaseService.deleteFile(pathToDelete)

      return { message: 'Xóa tệp thành công.' }
    } catch (error) {
      throw error
    }
  })

// Get file metadata
export const getFileMetadata = protectedActionClient
  .inputSchema(z.object({ filePath: z.string() }), {
    handleValidationErrorsShape: async (ve) => flattenValidationErrors(ve).fieldErrors
  })
  .action(async ({ parsedInput }) => {
    try {
      const { filePath } = parsedInput

      const metadata = await firebaseService.getFileMetadata(filePath)

      return metadata
    } catch (error) {
      throw error
    }
  })

export async function syncUserFromClerk({
  clerkId,
  email,
  firstName,
  lastName,
  imageUrl
}: {
  clerkId: string
  firstName: string | null
  lastName: string | null
  email: string
  imageUrl: string
}) {
  const existingUser = await prisma.user.findUnique({
    where: { clerkId },
    select: userSelect
  })

  if (!existingUser) {
    await clerkService.syncUserFromClerk({
      clerkId,
      email,
      firstName,
      lastName,
      imageUrl
    })
  }
}
