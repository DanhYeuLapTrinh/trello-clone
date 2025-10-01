'use server'

import { publicActionClient } from '@/lib/safe-action'
import { deleteFileSchema, uploadFilesSchema } from '@/lib/validations'
import firebaseService from '@/services/firebase.service'

// Upload files
export const uploadFiles = publicActionClient.inputSchema(uploadFilesSchema).action(async ({ parsedInput }) => {
  try {
    const uploadedFiles = await firebaseService.uploadFiles(parsedInput.files, parsedInput.folder)

    return uploadedFiles
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
