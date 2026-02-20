import { MemoryEngine, FullPluginConfig, RedisEngine } from '../config/schema';

export const isRedisEngine = (config: FullPluginConfig): config is RedisEngine => {
  return config.engine === 'redis';
};
export const isMemoryEngine = (config: FullPluginConfig): config is MemoryEngine => {
  return config.engine === 'memory';
};
