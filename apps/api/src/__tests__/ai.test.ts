import { AIService, PlanOutput } from '../services/ai';

describe('AI Service', () => {
  describe('generatePlan', () => {
    it('should generate a valid plan output', async () => {
      const aiService = AIService.fromEnv();
      
      const result = await aiService.generatePlan('Learn Python');
      
      expect(result).toHaveProperty('title');
      expect(result).toHaveProperty('description');
      expect(result).toHaveProperty('tasks');
      expect(Array.isArray(result.tasks)).toBe(true);
    });

    it('should have tasks with required properties', async () => {
      const aiService = AIService.fromEnv();
      
      const result = await aiService.generatePlan('Build a website');
      
      if (result.tasks.length > 0) {
        expect(result.tasks[0]).toHaveProperty('title');
        expect(result.tasks[0]).toHaveProperty('description');
        expect(result.tasks[0]).toHaveProperty('xpValue');
      }
    });
  });
});
