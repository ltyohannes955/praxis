import { Router, Response } from 'express';
import { generateAccessToken, generateRefreshTokenPair, refreshAccessToken, revokeRefreshToken } from '../services/jwt.js';
import { prisma } from '@praxis/database';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { refreshTokenSchema, authSchema, createError } from '@praxis/shared';

export const authRouter = Router();

authRouter.post('/signup/email', validate(authSchema), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { email, password, name } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw createError(400, 'User already exists', 'USER_EXISTS');
    }

    const user = await prisma.user.create({
      data: {
        email,
        name: name || email.split('@')[0],
      },
    });

    const accessToken = await generateAccessToken(user.id, user.email, user.name || undefined);
    const refreshTokenData = await generateRefreshTokenPair(user.id);

    res.cookie('refreshToken', refreshTokenData.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      success: true,
      data: {
        user: { id: user.id, email: user.email, name: user.name },
        accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
});

authRouter.post('/signin/email', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw createError(401, 'Invalid credentials', 'INVALID_CREDENTIALS');
    }

    const accessToken = await generateAccessToken(user.id, user.email, user.name || undefined);
    const refreshTokenData = await generateRefreshTokenPair(user.id);

    res.cookie('refreshToken', refreshTokenData.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      data: {
        user: { id: user.id, email: user.email, name: user.name },
        accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
});

authRouter.post('/refresh', validate(refreshTokenSchema), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { refreshToken } = req.body;
    const tokens = await refreshAccessToken(refreshToken);

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      data: {
        accessToken: tokens.accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
});

authRouter.post('/logout', authenticate, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    
    if (refreshToken) {
      await revokeRefreshToken(refreshToken);
    }

    res.clearCookie('refreshToken');
    
    res.json({
      success: true,
      data: { message: 'Logged out successfully' },
    });
  } catch (error) {
    next(error);
  }
});

authRouter.get('/me', authenticate, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw createError(404, 'User not found', 'USER_NOT_FOUND');
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
});
