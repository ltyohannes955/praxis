import { Router, Response, NextFunction } from 'express';
import { prisma } from '@praxis/database';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.js';
import { validate, validateParams, validateQuery } from '../middleware/validation.js';
import { createPlanSchema, updatePlanSchema, planParamsSchema, planQuerySchema, generatePlanSchema, createPaginatedResponse } from '@praxis/shared';
import { AppError } from '@praxis/shared';
import { Queue } from 'bullmq';

function parseRedisUrl(url: string) {
  try {
    const parsed = new URL(url);
    return {
      host: parsed.hostname,
      port: parseInt(parsed.port) || 6379,
    };
  } catch {
    return { host: 'localhost', port: 6379 };
  }
}

const redisConfig = parseRedisUrl(process.env.REDIS_URL || 'redis://localhost:6379');

const planGenerationQueue = new Queue('plan-generation', {
  connection: redisConfig,
});

export const plansRouter = Router();

plansRouter.get('/', authenticate, validateQuery(planQuerySchema), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string | undefined;
    const skip = (page - 1) * limit;

    const where = {
      userId: req.userId,
      ...(status && { status: status as any }),
    };

    const [plans, total] = await Promise.all([
      prisma.plan.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          tasks: {
            orderBy: { order: 'asc' },
          },
        },
      }),
      prisma.plan.count({ where }),
    ]);

    const response = createPaginatedResponse(plans, page, limit, total);
    res.json(response);
  } catch (error) {
    next(error);
  }
});

plansRouter.get('/:id', authenticate, validateParams(planParamsSchema), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const plan = await prisma.plan.findFirst({
      where: { id, userId: req.userId },
      include: {
        tasks: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!plan) {
      throw new AppError('Plan not found', 404, 'PLAN_NOT_FOUND');
    }

    res.json({
      success: true,
      data: plan,
    });
  } catch (error) {
    next(error);
  }
});

plansRouter.post('/', authenticate, validate(createPlanSchema), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { title, description, content } = req.body;

    const plan = await prisma.plan.create({
      data: {
        title,
        description,
        content,
        userId: req.userId!,
      },
    });

    res.status(201).json({
      success: true,
      data: plan,
    });
  } catch (error) {
    next(error);
  }
});

plansRouter.put('/:id', authenticate, validateParams(planParamsSchema), validate(updatePlanSchema), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { title, description, content, status } = req.body;

    const existingPlan = await prisma.plan.findFirst({
      where: { id, userId: req.userId },
    });

    if (!existingPlan) {
      throw new AppError('Plan not found', 404, 'PLAN_NOT_FOUND');
    }

    const plan = await prisma.plan.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(content && { content }),
        ...(status && { 
          status,
          ...(status === 'COMPLETED' && { completedAt: new Date() }),
        }),
      },
    });

    res.json({
      success: true,
      data: plan,
    });
  } catch (error) {
    next(error);
  }
});

plansRouter.delete('/:id', authenticate, validateParams(planParamsSchema), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const existingPlan = await prisma.plan.findFirst({
      where: { id, userId: req.userId },
    });

    if (!existingPlan) {
      throw new AppError('Plan not found', 404, 'PLAN_NOT_FOUND');
    }

    await prisma.plan.delete({
      where: { id },
    });

    res.json({
      success: true,
      data: { message: 'Plan deleted successfully' },
    });
  } catch (error) {
    next(error);
  }
});

plansRouter.post('/generate', authenticate, validate(generatePlanSchema), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { prompt } = req.body;

    const plan = await prisma.plan.create({
      data: {
        title: 'Generating...',
        description: prompt,
        userId: req.userId!,
        status: 'PENDING',
      },
    });

    await planGenerationQueue.add('generate-plan', {
      planId: plan.id,
      prompt,
      userId: req.userId,
    });

    res.status(202).json({
      success: true,
      data: {
        planId: plan.id,
        message: 'Plan generation started',
      },
    });
  } catch (error) {
    next(error);
  }
});
