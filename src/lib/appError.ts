export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'UNPROCESSABLE'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR'
  | 'BAD_REQUEST'

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: ErrorCode,
    message: string,
    public readonly details?: string[],
  ) {
    super(message)
    this.name = 'AppError'
  }

  static badRequest(message: string, details?: string[]): AppError {
    return new AppError(400, 'BAD_REQUEST', message, details)
  }
  static validation(message: string, details?: string[]): AppError {
    return new AppError(422, 'VALIDATION_ERROR', message, details)
  }
  static unauthorized(message = 'Unauthorized'): AppError {
    return new AppError(401, 'UNAUTHORIZED', message)
  }
  static forbidden(message = 'Forbidden'): AppError {
    return new AppError(403, 'FORBIDDEN', message)
  }
  static notFound(resource = 'Resource'): AppError {
    return new AppError(404, 'NOT_FOUND', `${resource} not found`)
  }
  static conflict(message: string): AppError {
    return new AppError(409, 'CONFLICT', message)
  }
  static internal(message = 'Internal server error'): AppError {
    return new AppError(500, 'INTERNAL_ERROR', message)
  }
}
