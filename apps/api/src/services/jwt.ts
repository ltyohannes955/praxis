import 'dotenv/config';
import jwt from 'jsonwebtoken';
import { prisma } from '@praxis/database';
import { generateRefreshToken, hashToken, AppError } from '@praxis/shared';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-12345';
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60 * 1000;

export interface TokenPayload {
  userId: string;
  email: string;
  name?: string;
}

export async function generateAccessToken(userId: string, email: string, name?: string): Promise<string> {
  const payload: TokenPayload = { userId, email, name };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
}

export async function generateRefreshTokenPair(userId: string): Promise<{ token: string; hashedToken: string; expiresAt: Date }> {
  const token = generateRefreshToken();
  const hashedToken = hashToken(token);
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY);

  await prisma.refreshToken.create({
    data: {
      token: hashedToken,
      userId,
      expires: expiresAt,
    },
  });

  return { token, hashedToken, expiresAt };
}

export async function verifyAccessToken(token: string): Promise<TokenPayload> {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
}

export async function verifyRefreshToken(token: string): Promise<string | null> {
  const hashedToken = hashToken(token);
  
  const refreshToken = await prisma.refreshToken.findUnique({
    where: { token: hashedToken },
    include: { user: true },
  });

  if (!refreshToken) {
    return null;
  }

  if (refreshToken.expires < new Date()) {
    await prisma.refreshToken.delete({ where: { id: refreshToken.id } });
    return null;
  }

  return refreshToken.userId;
}

export async function refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
  const userId = await verifyRefreshToken(refreshToken);
  
  if (!userId) {
    throw new AppError('Invalid refresh token', 401, 'INVALID_REFRESH_TOKEN');
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  
  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  await prisma.refreshToken.deleteMany({
    where: { userId, expires: { lt: new Date() } },
  });

  const newRefreshTokenData = await generateRefreshTokenPair(userId);
  const accessToken = await generateAccessToken(userId, user.email, user.name || undefined);

  return {
    accessToken,
    refreshToken: newRefreshTokenData.token,
  };
}

export async function revokeRefreshToken(token: string): Promise<void> {
  const hashedToken = hashToken(token);
  await prisma.refreshToken.deleteMany({
    where: { token: hashedToken },
  });
}

export async function revokeAllUserTokens(userId: string): Promise<void> {
  await prisma.refreshToken.deleteMany({
    where: { userId },
  });
}
