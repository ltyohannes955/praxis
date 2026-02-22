import { Request, Response, NextFunction } from 'express';
import { AppError } from '@praxis/shared';
import { verifyAccessToken } from '../services/jwt.js';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  user?: {
    id: string;
    email: string;
    name?: string;
  };
}

export async function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('No token provided', 401, 'NO_TOKEN');
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      throw new AppError('Invalid token format', 401, 'INVALID_TOKEN');
    }

    try {
      const decoded = await verifyAccessToken(token);
      req.userId = decoded.userId;
      req.user = decoded as any;
      next();
    } catch (jwtError) {
      throw new AppError('Invalid or expired token', 401, 'INVALID_TOKEN');
    }
  } catch (error) {
    next(error);
  }
}

export function optionalAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    authenticate(req, res, next);
  } else {
    next();
  }
}
