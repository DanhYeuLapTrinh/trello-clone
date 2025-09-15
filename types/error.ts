export interface AppErrorType {
  name: string
  message: string
  statusCode: number
  details?: unknown
}

export class AppError extends Error implements AppErrorType {
  name: string
  statusCode: number
  details?: unknown

  constructor({
    name = 'AppError',
    message = 'An unexpected error occurred',
    statusCode = 500,
    details
  }: Partial<AppErrorType> = {}) {
    super(message)
    this.name = name
    this.statusCode = statusCode
    this.details = details

    Object.setPrototypeOf(this, new.target.prototype)
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super({
      name: 'NotFoundError',
      message: `${resource} not found`,
      statusCode: 404
    })
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string) {
    super({
      name: 'UnauthorizedError',
      message,
      statusCode: 401
    })
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super({
      name: 'ValidationError',
      message,
      statusCode: 400,
      details
    })
  }
}
