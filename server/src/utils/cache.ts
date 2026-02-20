import { MemoryEngine, FullPluginConfig, RedisEngine } from '../config/schema';

export const isRedisEngine = (config: FullPluginConfig): config is RedisEngine =>
  config.engine === 'redis';

export const isMemoryEngine = (config: FullPluginConfig): config is MemoryEngine =>
  config.engine === 'memory';

export const isCacheEnabled = (config: FullPluginConfig): boolean =>
  config.engine === 'memory' || config.engine === 'redis';
