import { isRedisEngine, isMemoryEngine } from '../cache';
import { MemoryEngine, RedisEngine } from '../../config/schema';

describe('cacheDetection', () => {
  describe('isRedisEngine', () => {
    it('should return true for Redis engine config', () => {
      // Arrange
      const redisConfig: RedisEngine = {
        engine: 'redis',
        connection: {
          host: 'localhost',
          port: 6379,
          db: 0,
        },
      };

      // Act
      const result = isRedisEngine(redisConfig);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false for Memory engine config', () => {
      // Arrange
      const memoryConfig: MemoryEngine = {
        engine: 'memory',
      };

      // Act
      const result = isRedisEngine(memoryConfig);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('isMemoryEngine', () => {
    it('should return true for Memory engine config', () => {
      const memoryConfig: MemoryEngine = {
        engine: 'memory',
      };

      // Act
      const result = isMemoryEngine(memoryConfig);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false for Redis engine config', () => {
      const redisConfig: RedisEngine = {
        engine: 'redis',
        connection: {
          host: 'localhost',
          port: 6379,
          db: 0,
        },
      };

      // Act
      const result = isMemoryEngine(redisConfig);

      // Assert
      expect(result).toBe(false);
    });
  });
});
