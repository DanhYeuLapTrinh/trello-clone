import admin from 'firebase-admin'

interface FirebaseAdminAppParams {
  projectId: string
  clientEmail: string
  privateKey: string
  storageBucket: string
}

const formatPrivateKey = (privateKey: string) => {
  return privateKey.replace(/\\n/g, '\n')
}

export const createFirebaseAdminApp = (params: FirebaseAdminAppParams) => {
  const privateKey = formatPrivateKey(params.privateKey)

  if (admin.apps.length > 0) {
    return admin.app()
  }

  const cert = admin.credential.cert({
    projectId: params.projectId,
    clientEmail: params.clientEmail,
    privateKey: privateKey
  })

  return admin.initializeApp({
    credential: cert,
    projectId: params.projectId,
    storageBucket: params.storageBucket
  })
}

export const initFirebaseAdmin = () => {
  const params: FirebaseAdminAppParams = {
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID as string,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL as string,
    privateKey: process.env.FIREBASE_PRIVATE_KEY as string,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET as string
  }

  return createFirebaseAdminApp(params)
}
