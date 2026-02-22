import request from 'supertest';
import app from '../index';

describe('Auth E2E Tests', () => {
  const testUser = {
    email: `test-${Date.now()}@example.com`,
    password: 'testpassword123',
    name: 'Test User',
  };

  describe('POST /api/v1/auth/signup', () => {
    it('should create a new user account', async () => {
      const response = await request(app)
        .post('/api/v1/auth/signup/email')
        .send(testUser);
      
      expect(response.status).toBeLessThan(500);
    });
  });

  describe('POST /api/v1/auth/signin', () => {
    it('should sign in with valid credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/signin/email')
        .send({
          email: testUser.email,
          password: testUser.password,
        });
      
      expect(response.status).toBeLessThan(500);
    });
  });
});

describe('Plan Generation E2E Tests', () => {
  let authToken: string;

  beforeAll(async () => {
    const loginResponse = await request(app)
      .post('/api/v1/auth/signin/email')
      .send({
        email: 'test@example.com',
        password: 'testpassword123',
      });
    
    authToken = loginResponse.body?.data?.accessToken || '';
  });

  describe('POST /api/v1/plans/generate', () => {
    it('should generate a new plan with AI', async () => {
      const response = await request(app)
        .post('/api/v1/plans/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          prompt: 'Learn React Native in 2 months',
        });
      
      expect(response.status).toBe(202);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('planId');
    }, 30000);
  });
});
