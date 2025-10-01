import { initFirebaseAdmin } from '@/lib/firebase-admin'
import { FileInfo } from '@/types/common'
import { BadRequestError, NotFoundError } from '@/types/error'
import { v4 as uuidv4 } from 'uuid'

class FirebaseService {
  private admin: ReturnType<typeof import('@/lib/firebase-admin').initFirebaseAdmin>

  constructor() {
    this.admin = initFirebaseAdmin()
  }

  private get storage() {
    return this.admin.storage()
  }

  private get bucket() {
    return this.storage.bucket()
  }

  public async uploadFiles(files: File[], folder: string = 'uploads'): Promise<FileInfo[]> {
    try {
      const uploadedFiles = await Promise.all(files.map((file) => this.uploadFile(file, folder)))

      return uploadedFiles
    } catch (error) {
      throw error
    }
  }

  public async uploadFile(file: File, folder: string = 'uploads'): Promise<FileInfo> {
    try {
      const fileExtension = file.name.split('.').pop()
      const fileName = `${uuidv4()}.${fileExtension}`

      const filePath = `${folder}/${fileName}`

      // Convert File to Buffer
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      // Create file reference
      const fileRef = this.bucket.file(filePath)

      // Upload file
      await fileRef.save(buffer, {
        metadata: {
          contentType: file.type,
          metadata: {
            originalName: file.name,
            uploadedAt: new Date().toISOString()
          }
        }
      })

      // Make file publicly accessible
      await fileRef.makePublic()

      // Get public URL
      const publicUrl = `https://storage.googleapis.com/${this.bucket.name}/${filePath}`

      return {
        url: publicUrl,
        path: filePath,
        name: fileName,
        size: file.size,
        type: file.type
      }
    } catch (error) {
      throw error
    }
  }

  public async deleteFile(filePath: string) {
    try {
      const fileRef = this.bucket.file(filePath)

      const exists = await this.fileExists(filePath)
      if (!exists) {
        throw new NotFoundError('File not found')
      }

      await fileRef.delete()
    } catch (error) {
      throw error
    }
  }

  public extractFilePathFromUrl(url: string) {
    try {
      const bucketName = this.bucket.name
      const baseUrl = `https://storage.googleapis.com/${bucketName}/`

      if (!url.startsWith(baseUrl)) {
        throw new BadRequestError('Invalid Firebase Storage URL')
      }

      return url.replace(baseUrl, '')
    } catch (error) {
      throw error
    }
  }

  public async getFileMetadata(filePath: string) {
    try {
      const fileRef = this.bucket.file(filePath)
      const [metadata] = await fileRef.getMetadata()

      return metadata
    } catch (error) {
      throw error
    }
  }

  public async fileExists(filePath: string) {
    try {
      const fileRef = this.bucket.file(filePath)
      const [exists] = await fileRef.exists()

      return exists
    } catch {
      return false
    }
  }
}

const firebaseService = new FirebaseService()
export default firebaseService
