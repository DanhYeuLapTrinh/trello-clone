'use server'

import { publicActionClient } from '@/lib/safe-action'
import { deleteFileSchema, uploadFileSchema } from '@/lib/validations'
import firebaseService from '@/services/firebase.service'
import { revalidatePath } from 'next/cache'

// Upload file
export const uploadFile = publicActionClient.inputSchema(uploadFileSchema).action(async ({ parsedInput }) => {
  try {
    const { file, folder, customFileName } = parsedInput

    await firebaseService.uploadFile(file, folder, customFileName)

    revalidatePath('/')

    return { message: 'Tải tệp lên thành công.' }
  } catch (error) {
    throw error
  }
})

// Delete file
export const deleteFile = publicActionClient.inputSchema(deleteFileSchema).action(async ({ parsedInput }) => {
  try {
    const { filePath, url } = parsedInput

    // If URL is provided, extract file path from it
    let pathToDelete = filePath

    if (url && !filePath) {
      pathToDelete = firebaseService.extractFilePathFromUrl(url)
    }

    await firebaseService.deleteFile(pathToDelete)

    return { message: 'Xóa tệp thành công.' }
  } catch (error) {
    throw error
  }
})

// Get file metadata
export const getFileMetadata = publicActionClient
  .inputSchema(deleteFileSchema.pick({ filePath: true }))
  .action(async ({ parsedInput }) => {
    try {
      const { filePath } = parsedInput

      const metadata = await firebaseService.getFileMetadata(filePath)

      return metadata
    } catch (error) {
      throw error
    }
  })
