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

const memoryEngine = pluginConfig.extend({
  engine: z.literal('memory'),
});
export type MemoryEngine = z.infer<typeof memoryEngine>;

const redisEngine = pluginConfig.extend({
  engine: z.literal('redis'),
  connection: z.object({
    host: z.string().min(1),
    port: z.number().int().positive(),
    db: z.number().int().positive(),
    password: z.string().optional(),
    username: z.string().optional(),
  }),
});

export type RedisEngine = z.infer<typeof redisEngine>;

export const schemaConfig = z.intersection(
  pluginConfig,
  z.discriminatedUnion('engine', [memoryEngine, redisEngine])
);

export type FullPluginConfig = z.infer<typeof schemaConfig>;
