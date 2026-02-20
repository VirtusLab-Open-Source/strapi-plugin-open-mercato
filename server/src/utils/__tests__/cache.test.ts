import { isRedisEngine, isMemoryEngine, isCacheEnabled } from '../cache';
import { FullPluginConfig } from '../../config/schema';

const baseConfig = { encryptionKey: '01234567890123456789012345678901' };

describe('cacheDetection', () => {
  describe('isRedisEngine', () => {
    it('should return true for Redis engine config', () => {
      const config = {
        ...baseConfig,
        engine: 'redis' as const,
        connection: { host: 'localhost', port: 6379, db: 0 },
      };
      expect(isRedisEngine(config)).toBe(true);
    });

    it('should return false for Memory engine config', () => {
      const config = { ...baseConfig, engine: 'memory' as const };
      expect(isRedisEngine(config)).toBe(false);
    });

    it('should return false when no engine configured', () => {
      expect(isRedisEngine(baseConfig as FullPluginConfig)).toBe(false);
    });
  });

  describe('isMemoryEngine', () => {
    it('should return true for Memory engine config', () => {
      const config = { ...baseConfig, engine: 'memory' as const };
      expect(isMemoryEngine(config)).toBe(true);
    });

    it('should return false for Redis engine config', () => {
      const config = {
        ...baseConfig,
        engine: 'redis' as const,
        connection: { host: 'localhost', port: 6379, db: 0 },
      };
      expect(isMemoryEngine(config)).toBe(false);
    });

    it('should return false when no engine configured', () => {
      expect(isMemoryEngine(baseConfig as FullPluginConfig)).toBe(false);
    });
  });

  describe('isCacheEnabled', () => {
    it('should return true for memory engine', () => {
      const config = { ...baseConfig, engine: 'memory' as const };
      expect(isCacheEnabled(config)).toBe(true);
    });

    it('should return true for redis engine', () => {
      const config = {
        ...baseConfig,
        engine: 'redis' as const,
        connection: { host: 'localhost', port: 6379, db: 0 },
      };
      expect(isCacheEnabled(config)).toBe(true);
    });

    it('should return false when no engine configured', () => {
      expect(isCacheEnabled(baseConfig as FullPluginConfig)).toBe(false);
    });
  });
});
