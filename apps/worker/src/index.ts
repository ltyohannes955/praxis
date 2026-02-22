import 'dotenv/config';
import { Worker, Queue, QueueEvents } from 'bullmq';
import { prisma } from '@praxis/database';
import { AIService, PlanOutput } from '@praxis/ai';

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

const connection = parseRedisUrl(process.env.REDIS_URL || 'redis://localhost:6379');

const aiService = AIService.fromEnv();

const planGenerationWorker = new Worker('plan-generation', async (job) => {
  console.log(`📝 Processing plan generation: ${job.id}`);
  
  const { planId, prompt, userId } = job.data;

  try {
    await prisma.plan.update({
      where: { id: planId },
      data: { status: 'PROCESSING' },
    });

    const planOutput = await aiService.generatePlan(prompt);

    await prisma.plan.update({
      where: { id: planId },
      data: {
        title: planOutput.title,
        description: planOutput.description,
        content: planOutput as any,
      },
    });

    const tasks = await Promise.all(
      planOutput.tasks.map((task, index) =>
        prisma.task.create({
          data: {
            title: task.title,
            description: task.description,
            xpValue: task.xpValue,
            planId,
            order: index + 1,
          },
        })
      )
    );

    await prisma.plan.update({
      where: { id: planId },
      data: { status: 'COMPLETED' },
    });

    console.log(`✅ Plan generated successfully: ${planId}`);
    
    return { planId, taskCount: tasks.length };
  } catch (error) {
    console.error(`❌ Plan generation failed: ${planId}`, error);

    await prisma.plan.update({
      where: { id: planId },
      data: { 
        status: 'FAILED',
        content: { error: (error as Error).message } as any,
      },
    });

    throw error;
  }
}, {
  connection,
  concurrency: 2,
  removeOnComplete: { count: 100 },
  removeOnFail: { count: 50 },
});

const xpRecalculationWorker = new Worker('xp-recalculation', async (job) => {
  console.log(`⚡ Processing XP recalculation: ${job.id}`);
  
  const { userId } = job.data;

  try {
    const completedPlans = await prisma.plan.findMany({
      where: { userId, status: 'COMPLETED' },
      include: { tasks: true },
    });

    let totalXP = 0;
    for (const plan of completedPlans) {
      for (const task of plan.tasks) {
        if (task.status === 'COMPLETED') {
          totalXP += task.xpValue;
        }
      }
    }

    console.log(`✅ XP recalculated for user ${userId}: ${totalXP}`);
    
    return { userId, totalXP };
  } catch (error) {
    console.error(`❌ XP recalculation failed: ${job.id}`, error);
    throw error;
  }
}, {
  connection,
  concurrency: 5,
  removeOnComplete: { count: 100 },
  removeOnFail: { count: 50 },
});

const taskRegenerationWorker = new Worker('task-regeneration', async (job) => {
  console.log(`🔄 Processing task regeneration: ${job.id}`);
  
  const { taskId, context } = job.data;

  try {
    await prisma.task.update({
      where: { id: taskId },
      data: { status: 'PROCESSING' },
    });

    const response = await aiService.chat([
      { role: 'system', content: 'You are a helpful assistant that generates task details.' },
      { role: 'user', content: `Regenerate task with context: ${context}` },
    ]);

    await prisma.task.update({
      where: { id: taskId },
      data: { 
        content: { regenerated: response.content } as any,
        status: 'PENDING',
      },
    });

    console.log(`✅ Task regenerated: ${taskId}`);
    
    return { taskId, regenerated: true };
  } catch (error) {
    console.error(`❌ Task regeneration failed: ${job.id}`, error);
    
    await prisma.task.update({
      where: { id: taskId },
      data: { status: 'FAILED' },
    });
    
    throw error;
  }
}, {
  connection,
  concurrency: 3,
  removeOnComplete: { count: 100 },
  removeOnFail: { count: 50 },
});

planGenerationWorker.on('completed', (job) => {
  console.log(`🎉 Job ${job.id} completed`);
});

planGenerationWorker.on('failed', (job, err) => {
  console.error(`💥 Job ${job?.id} failed:`, err.message);
});

xpRecalculationWorker.on('completed', (job) => {
  console.log(`🎉 XP Job ${job.id} completed`);
});

xpRecalculationWorker.on('failed', (job, err) => {
  console.error(`💥 XP Job ${job?.id} failed:`, err.message);
});

taskRegenerationWorker.on('completed', (job) => {
  console.log(`🎉 Regeneration Job ${job.id} completed`);
});

taskRegenerationWorker.on('failed', (job, err) => {
  console.error(`💥 Regeneration Job ${job?.id} failed:`, err.message);
});

export const planQueue = new Queue('plan-generation', { connection });
export const xpQueue = new Queue('xp-recalculation', { connection });
export const taskQueue = new Queue('task-regeneration', { connection });

console.log('🚀 Worker service started');

process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing workers...');
  await planGenerationWorker.close();
  await xpRecalculationWorker.close();
  await taskRegenerationWorker.close();
  await prisma.$disconnect();
  process.exit(0);
});
