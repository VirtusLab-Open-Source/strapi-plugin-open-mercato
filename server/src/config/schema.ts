import { z } from 'zod';

export const pluginConfig = z.object({
  apiUrl: z.string().url().optional(),
  accessToken: z.string().min(1).optional(),
  encryptionKey: z.string().length(32),
});
export type PluginConfig = z.infer<typeof pluginConfig>;

export const settingsConfig = z.object({
  apiUrl: z.string().url(),
  accessToken: z.string().min(1),
});
export type SettingsConfig = z.infer<typeof settingsConfig>;

const redisConnection = z.object({
  host: z.string().min(1),
  port: z.number().int().positive(),
  db: z.number().int().positive(),
  password: z.string().optional(),
  username: z.string().optional(),
});

export const schemaConfig = pluginConfig.extend({
  engine: z.enum(['memory', 'redis']).optional(),
  connection: redisConnection.optional(),
}).refine(
  (data) => data.engine !== 'redis' || data.connection !== undefined,
  { message: 'Redis connection config is required when engine is "redis"', path: ['connection'] }
);

export type FullPluginConfig = z.infer<typeof schemaConfig>;

export type MemoryEngine = FullPluginConfig & { engine: 'memory' };
export type RedisEngine = FullPluginConfig & { engine: 'redis'; connection: z.infer<typeof redisConnection> };
