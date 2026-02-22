import { Request, Response, NextFunction } from 'express';
import { AppError } from '@praxis/shared';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const appError = err as AppError;
  
  const statusCode = appError.statusCode || 500;
  const code = appError.code || 'INTERNAL_ERROR';
  const message = appError.message || 'An unexpected error occurred';

  console.error(`[Error] ${code}: ${message}`, {
    path: req.path,
    method: req.method,
    statusCode,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      code,
      statusCode,
    },
  });
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: {
      message: 'Resource not found',
      code: 'NOT_FOUND',
      statusCode: 404,
    },
  });
}
