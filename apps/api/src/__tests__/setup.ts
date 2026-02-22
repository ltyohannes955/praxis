jest.setTimeout(10000);

process.env.JWT_SECRET = 'test-jwt-secret';
process.env.BETTER_AUTH_SECRET = 'test-better-auth-secret';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.OLLAMA_BASE_URL = 'http://localhost:11434';
process.env.AI_MODEL = 'mistral';
process.env.NODE_ENV = 'test';
