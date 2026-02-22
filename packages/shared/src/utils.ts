import crypto from 'crypto';

export function generateRefreshToken(): string {
  return crypto.randomBytes(64).toString('hex');
}

export function generateAccessToken(userId: string): string {
  return crypto.randomBytes(32).toString('hex');
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function createError(statusCode: number, message: string, code?: string): AppError {
  const error = new Error(message) as AppError;
  error.statusCode = statusCode;
  error.code = code || 'ERROR';
  return error;
}

export interface AppError extends Error {
  statusCode: number;
  code: string;
}

export class AppError extends Error implements AppError {
  statusCode: number;
  code: string;

  constructor(message: string, statusCode: number = 500, code: string = 'ERROR') {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    Error.captureStackTrace(this, this.constructor);
  }
}

export type JsonValue = string | number | boolean | null | JsonObject | JsonArray;
export type JsonObject = { [key: string]: JsonValue };
export type JsonArray = JsonValue[];

export function formatJsonResponse<T>(data: T): ApiResponse<T> {
  return {
    success: true,
    data,
  };
}

export function formatErrorResponse(error: Error | AppError): ApiResponse<null> {
  const appError = error as AppError;
  return {
    success: false,
    error: {
      message: error.message,
      code: appError.code || 'INTERNAL_ERROR',
      statusCode: appError.statusCode || 500,
    },
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code: string;
    statusCode: number;
  };
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function createPaginatedResponse<T>(
  data: T[],
  page: number,
  limit: number,
  total: number
): PaginatedResponse<T> {
  return {
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
