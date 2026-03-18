export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    isOperational: boolean = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
    Object.setPrototypeOf(this, AppError.prototype);
  }

  static unauthorized(message = 'Unauthorized'): AppError {
    return new AppError(message, 401, 'UNAUTHORIZED');
  }

  static forbidden(message = 'Forbidden'): AppError {
    return new AppError(message, 403, 'FORBIDDEN');
  }

  static notFound(resource = 'Resource'): AppError {
    return new AppError(`${resource} not found`, 404, 'NOT_FOUND');
  }

  static badRequest(message: string): AppError {
    return new AppError(message, 400, 'BAD_REQUEST');
  }

  static conflict(message: string): AppError {
    return new AppError(message, 409, 'CONFLICT');
  }

  static tooManyRequests(message = 'Too many requests'): AppError {
    return new AppError(message, 429, 'RATE_LIMITED');
  }

  static internal(message = 'Internal server error'): AppError {
    return new AppError(message, 500, 'INTERNAL_ERROR', false);
  }
}

export const asyncHandler = (
  fn: (req: any, res: any, next: any) => Promise<any>
) => {
  return (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export const createSuccessResponse = <T>(
  data: T,
  message?: string,
  meta?: Record<string, unknown>
) => ({
  success: true,
  message,
  data,
  ...(meta && { meta }),
  timestamp: new Date().toISOString(),
});

export const createPaginatedResponse = <T>(
  data: T[],
  total: number,
  page: number,
  limit: number
) => ({
  success: true,
  data,
  meta: {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    hasNextPage: page * limit < total,
    hasPrevPage: page > 1,
  },
  timestamp: new Date().toISOString(),
});
