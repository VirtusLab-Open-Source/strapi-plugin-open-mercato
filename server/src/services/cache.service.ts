import { Core } from '@strapi/strapi';
import Redis from 'ioredis';
import { LRUCache } from 'lru-cache';
import { StrapiContext } from '../@types';
import { getENVConfig, isMemoryEngine, isRedisEngine } from '../utils';

const noopCache: CacheService = {
  get: async () => undefined,
  set: async () => {},
  has: async () => false,
};

const getEngine = (strapi: Core.Strapi): CacheService => {
  const config = getENVConfig(strapi);

  if (!config.engine) {
    return noopCache;
  }
  if (isMemoryEngine(config)) {
    const lruCache = new LRUCache<string, unknown>({ max: 500 });
    return {
      set: async <T>(key: string, value: T): Promise<void> => {
        lruCache.set(key, value);
      },
      get: async <T>(key: string): Promise<T | undefined> => {
        return lruCache.get(key) as T | undefined;
      },
      has: async (key: string): Promise<boolean> => {
        return lruCache.has(key);
      },
    };
  }
  if (isRedisEngine(config)) {
    const cache = new Redis(config.connection);
    return {
      set: async <T>(key: string, value: T): Promise<void> => {
        await cache.set(key, JSON.stringify(value));
      },
      get: async <T>(key: string): Promise<T | undefined> => {
        const value = await cache.get(key);
        return value ? JSON.parse(value) : undefined;
      },
      has: async (key: string): Promise<boolean> => {
        return (await cache.exists(key)) === 1;
      },
    };
  }
  throw new Error(`Unsupported cache engine: ${config.engine}`);
};

export type CacheService = {
  get: <T>(key: string) => Promise<T | undefined>;
  set: <T>(key: string, value: T) => Promise<void>;
  has: (key: string) => Promise<boolean>;
};

const cacheService = ({ strapi }: StrapiContext): CacheService => getEngine(strapi);

export default cacheService;
