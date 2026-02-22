import { Router, Response, NextFunction } from 'express';
import { prisma } from '@praxis/database';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.js';
import { validate, validateParams } from '../middleware/validation.js';
import { createTaskSchema, updateTaskSchema, taskParamsSchema, AppError } from '@praxis/shared';

export const tasksRouter = Router();

tasksRouter.get('/plan/:planId', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { planId } = req.params;

    const plan = await prisma.plan.findFirst({
      where: { id: planId, userId: req.userId },
    });

    if (!plan) {
      throw new AppError('Plan not found', 404, 'PLAN_NOT_FOUND');
    }

    const tasks = await prisma.task.findMany({
      where: { planId },
      orderBy: { order: 'asc' },
    });

    res.json({
      success: true,
      data: tasks,
    });
  } catch (error) {
    next(error);
  }
});

tasksRouter.get('/:id', authenticate, validateParams(taskParamsSchema), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const task = await prisma.task.findFirst({
      where: { id, plan: { userId: req.userId } },
      include: { plan: true },
    });

    if (!task) {
      throw new AppError('Task not found', 404, 'TASK_NOT_FOUND');
    }

    res.json({
      success: true,
      data: task,
    });
  } catch (error) {
    next(error);
  }
});

tasksRouter.post('/', authenticate, validate(createTaskSchema), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { planId, title, description, content, xpValue } = req.body;

    const plan = await prisma.plan.findFirst({
      where: { id: planId, userId: req.userId },
    });

    if (!plan) {
      throw new AppError('Plan not found', 404, 'PLAN_NOT_FOUND');
    }

    const lastTask = await prisma.task.findFirst({
      where: { planId },
      orderBy: { order: 'desc' },
    });

    const task = await prisma.task.create({
      data: {
        title,
        description,
        content,
        xpValue,
        planId,
        order: (lastTask?.order || 0) + 1,
      },
    });

    res.status(201).json({
      success: true,
      data: task,
    });
  } catch (error) {
    next(error);
  }
});

tasksRouter.put('/:id', authenticate, validateParams(taskParamsSchema), validate(updateTaskSchema), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { title, description, content, status, xpValue, order } = req.body;

    const existingTask = await prisma.task.findFirst({
      where: { id, plan: { userId: req.userId } },
    });

    if (!existingTask) {
      throw new AppError('Task not found', 404, 'TASK_NOT_FOUND');
    }

    const task = await prisma.task.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(content && { content }),
        ...(status && { 
          status,
          ...(status === 'COMPLETED' && { completedAt: new Date() }),
        }),
        ...(xpValue && { xpValue }),
        ...(order !== undefined && { order }),
      },
    });

    if (status === 'COMPLETED') {
      const plan = await prisma.plan.findUnique({
        where: { id: task.planId },
        include: { tasks: true },
      });

      const completedTasks = plan?.tasks.filter(t => t.status === 'COMPLETED').length || 0;
      const totalTasks = plan?.tasks.length || 0;

      if (completedTasks === totalTasks && totalTasks > 0) {
        await prisma.plan.update({
          where: { id: task.planId },
          data: { status: 'COMPLETED', completedAt: new Date() },
        });
      }
    }

    res.json({
      success: true,
      data: task,
    });
  } catch (error) {
    next(error);
  }
});

tasksRouter.delete('/:id', authenticate, validateParams(taskParamsSchema), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const existingTask = await prisma.task.findFirst({
      where: { id, plan: { userId: req.userId } },
    });

    if (!existingTask) {
      throw new AppError('Task not found', 404, 'TASK_NOT_FOUND');
    }

    await prisma.task.delete({
      where: { id },
    });

    res.json({
      success: true,
      data: { message: 'Task deleted successfully' },
    });
  } catch (error) {
    next(error);
  }
});

tasksRouter.post('/reorder', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { tasks } = req.body;

    if (!Array.isArray(tasks)) {
      throw new AppError('Tasks must be an array', 400, 'INVALID_REQUEST');
    }

    await Promise.all(
      tasks.map((task: { id: string; order: number }, index: number) =>
        prisma.task.update({
          where: { id: task.id },
          data: { order: task.order || index },
        })
      )
    );

    res.json({
      success: true,
      data: { message: 'Tasks reordered successfully' },
    });
  } catch (error) {
    next(error);
  }
});
