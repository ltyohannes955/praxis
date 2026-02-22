import { z } from 'zod';

export const userSchema = z.object({
  id: z.string().cuid(),
  email: z.string().email(),
  emailVerified: z.boolean().default(false),
  name: z.string().optional(),
  image: z.string().url().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createPlanSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  content: z.record(z.unknown()).optional(),
});

export const updatePlanSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  content: z.record(z.unknown()).optional(),
  status: z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED']).optional(),
});

export const planParamsSchema = z.object({
  id: z.string().cuid(),
});

export const planQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  status: z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED']).optional(),
});

export const createTaskSchema = z.object({
  planId: z.string().cuid(),
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  content: z.record(z.unknown()).optional(),
  xpValue: z.number().int().positive().default(10),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  content: z.record(z.unknown()).optional(),
  status: z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED']).optional(),
  xpValue: z.number().int().positive().optional(),
});

export const taskParamsSchema = z.object({
  id: z.string().cuid(),
  planId: z.string().cuid(),
});

export const generatePlanSchema = z.object({
  prompt: z.string().min(1).max(2000),
});

export const authSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
  name: z.string().min(1).max(100).optional(),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});

export type User = z.infer<typeof userSchema>;
export type CreatePlanInput = z.infer<typeof createPlanSchema>;
export type UpdatePlanInput = z.infer<typeof updatePlanSchema>;
export type PlanParams = z.infer<typeof planParamsSchema>;
export type PlanQuery = z.infer<typeof planQuerySchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type TaskParams = z.infer<typeof taskParamsSchema>;
export type GeneratePlanInput = z.infer<typeof generatePlanSchema>;
export type AuthInput = z.infer<typeof authSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
