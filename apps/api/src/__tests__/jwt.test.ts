import { generateAccessToken, verifyAccessToken } from '../services/jwt';

describe('JWT Service', () => {
  const testUserId = 'test-user-id';
  const testEmail = 'test@example.com';
  const testName = 'Test User';

  describe('generateAccessToken', () => {
    it('should generate a valid JWT token', async () => {
      const token = await generateAccessToken(testUserId, testEmail, testName);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify and decode a valid token', async () => {
      const token = await generateAccessToken(testUserId, testEmail, testName);
      const decoded = await verifyAccessToken(token);
      
      expect(decoded.userId).toBe(testUserId);
      expect(decoded.email).toBe(testEmail);
      expect(decoded.name).toBe(testName);
    });

    it('should throw error for invalid token', async () => {
      await expect(verifyAccessToken('invalid-token')).rejects.toThrow();
    });
  });
});
