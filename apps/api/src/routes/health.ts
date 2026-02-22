import { Router, Response } from 'express';
import { prisma } from '@praxis/database';

export const healthRouter = Router();

healthRouter.get('/', async (req, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    
    res.json({
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
          database: 'connected',
          api: 'running',
        },
      },
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      error: {
        message: 'Service unavailable',
        code: 'HEALTH_CHECK_FAILED',
        statusCode: 503,
      },
    });
  }
});

healthRouter.get('/ready', async (req, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    
    res.json({
      success: true,
      data: {
        ready: true,
      },
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      error: {
        message: 'Not ready',
        code: 'NOT_READY',
        statusCode: 503,
      },
    });
  }
});

healthRouter.get('/live', async (req, res: Response) => {
  res.json({
    success: true,
    data: {
      alive: true,
    },
  });
});
