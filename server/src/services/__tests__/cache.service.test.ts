import { Core } from '@strapi/strapi';
import Redis from 'ioredis';
import cacheService from '../cache.service';
import { getENVConfig, isMemoryEngine, isRedisEngine } from '../../utils';

jest.mock('ioredis');
jest.mock('../../utils', () => ({
  ...jest.requireActual('../../utils'),
  getENVConfig: jest.fn().mockReturnValue({}),
  isMemoryEngine: jest.fn().mockReturnValue(false),
  isRedisEngine: jest.fn().mockReturnValue(false),
}));

const getMockStrapi = (config: any) =>
  ({
    config: {
      get: jest.fn().mockReturnValue(config),
    },
  }) as unknown as Core.Strapi;

describe('cache.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('No cache (default)', () => {
    it('should return a no-op cache when no engine is configured', () => {
      // Arrange
      (getENVConfig as jest.Mock).mockReturnValue({});
      const mockStrapi = getMockStrapi({});

      // Act
      const service = cacheService({ strapi: mockStrapi });

      // Assert
      expect(service).toBeDefined();
      expect(typeof service.get).toBe('function');
      expect(typeof service.set).toBe('function');
      expect(typeof service.has).toBe('function');
    });

    it('no-op get always returns undefined', async () => {
      (getENVConfig as jest.Mock).mockReturnValue({});
      const service = cacheService({ strapi: getMockStrapi({}) });

      expect(await service.get('any-key')).toBeUndefined();
    });

    it('no-op has always returns false', async () => {
      (getENVConfig as jest.Mock).mockReturnValue({});
      const service = cacheService({ strapi: getMockStrapi({}) });

      expect(await service.has('any-key')).toBe(false);
    });

    it('no-op set does not throw', async () => {
      (getENVConfig as jest.Mock).mockReturnValue({});
      const service = cacheService({ strapi: getMockStrapi({}) });

      await expect(service.set('key', 'value')).resolves.toBeUndefined();
    });
  });

  describe('Memory Cache Engine', () => {
    const mockConfig = { engine: 'memory' };

    beforeEach(() => {
      (getENVConfig as jest.Mock).mockReturnValue(mockConfig);
      (isMemoryEngine as unknown as jest.Mock).mockReturnValue(true);
      (isRedisEngine as unknown as jest.Mock).mockReturnValue(false);
    });

    it('should initialize memory cache engine', () => {
      const service = cacheService({ strapi: getMockStrapi(mockConfig) });
      expect(service).toBeDefined();
    });

    it('should set and get value in memory cache', async () => {
      const service = cacheService({ strapi: getMockStrapi(mockConfig) });
      const key = 'test-key';
      const value = { test: 'value' };

      await service.set(key, value);
      const result = await service.get(key);

      expect(result).toEqual(value);
    });

    it('should return undefined for missing key', async () => {
      const service = cacheService({ strapi: getMockStrapi(mockConfig) });

      expect(await service.get('nonexistent')).toBeUndefined();
    });

    it('should check if key exists in memory cache', async () => {
      const service = cacheService({ strapi: getMockStrapi(mockConfig) });
      const key = 'test-key';

      expect(await service.has(key)).toBe(false);
      await service.set(key, 'value');
      expect(await service.has(key)).toBe(true);
    });
  });

  describe('Redis Cache Engine', () => {
    const mockConfig = {
      engine: 'redis',
      connection: { host: 'localhost', port: 6379, db: 0 },
    };

    beforeEach(() => {
      (getENVConfig as jest.Mock).mockReturnValue(mockConfig);
      (isMemoryEngine as unknown as jest.Mock).mockReturnValue(false);
      (isRedisEngine as unknown as jest.Mock).mockReturnValue(true);
    });

    it('should initialize Redis cache engine', () => {
      const mockRedis = { set: jest.fn(), get: jest.fn(), exists: jest.fn() };
      (Redis as unknown as jest.Mock).mockImplementation(() => mockRedis);

      const service = cacheService({ strapi: getMockStrapi(mockConfig) });

      expect(Redis).toHaveBeenCalledWith(mockConfig.connection);
      expect(service).toBeDefined();
    });

    it('should set value in Redis cache', async () => {
      const mockRedis = { set: jest.fn(), get: jest.fn(), exists: jest.fn() };
      (Redis as unknown as jest.Mock).mockImplementation(() => mockRedis);
      const service = cacheService({ strapi: getMockStrapi(mockConfig) });

      await service.set('key', { test: 'value' });

      expect(mockRedis.set).toHaveBeenCalledWith('key', JSON.stringify({ test: 'value' }));
    });

    it('should get value from Redis cache', async () => {
      const expectedValue = { test: 'value' };
      const mockRedis = {
        set: jest.fn(),
        get: jest.fn().mockResolvedValue(JSON.stringify(expectedValue)),
        exists: jest.fn(),
      };
      (Redis as unknown as jest.Mock).mockImplementation(() => mockRedis);
      const service = cacheService({ strapi: getMockStrapi(mockConfig) });

      const result = await service.get('key');

      expect(mockRedis.get).toHaveBeenCalledWith('key');
      expect(result).toEqual(expectedValue);
    });

    it('should check if key exists in Redis cache', async () => {
      const mockRedis = {
        set: jest.fn(),
        get: jest.fn(),
        exists: jest.fn().mockResolvedValue(1),
      };
      (Redis as unknown as jest.Mock).mockImplementation(() => mockRedis);
      const service = cacheService({ strapi: getMockStrapi(mockConfig) });

      expect(await service.has('key')).toBe(true);
      expect(mockRedis.exists).toHaveBeenCalledWith('key');
    });
  });

  describe('Error Cases', () => {
    it('should throw error when cache engine is not supported', () => {
      const mockConfig = { engine: 'unsupported' };
      (getENVConfig as jest.Mock).mockReturnValue(mockConfig);
      (isMemoryEngine as unknown as jest.Mock).mockReturnValue(false);
      (isRedisEngine as unknown as jest.Mock).mockReturnValue(false);

      expect(() => cacheService({ strapi: getMockStrapi(mockConfig) })).toThrow(
        'Unsupported cache engine: unsupported'
      );
    });
  });
});
