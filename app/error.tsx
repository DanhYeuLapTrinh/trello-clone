'use client'

import { AppErrorType } from '@/shared/error'
import { useEffect } from 'react'

interface ErrorProps {
  error: Error & Partial<AppErrorType>
  reset: () => void
}

export default function RootError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('Error occurred:', error)
  }, [error])

  const errorMessage =
    error.name === 'NotFoundError'
      ? `Resource not found: ${error.message}`
      : error.message || 'An unexpected error occurred'

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>Error</h1>
      <p>{errorMessage}</p>
      {error.statusCode && <p>Status Code: {error.statusCode}</p>}
      <button
        onClick={reset}
        style={{
          marginTop: '10px',
          padding: '8px 16px',
          cursor: 'pointer'
        }}
      >
        Try Again
      </button>
    </div>
  )
}
