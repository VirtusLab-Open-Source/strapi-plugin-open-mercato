import { pluginConfig, settingsConfig, schemaConfig } from '../schema';

describe('config/schema', () => {
  describe('pluginConfig', () => {
    it('accepts valid config with all fields', () => {
      const result = pluginConfig.safeParse({
        apiUrl: 'https://api.test.com',
        accessToken: 'token',
        encryptionKey: '01234567890123456789012345678901',
      });
      expect(result.success).toBe(true);
    });

    it('accepts config without apiUrl and accessToken', () => {
      const result = pluginConfig.safeParse({
        encryptionKey: '01234567890123456789012345678901',
      });
      expect(result.success).toBe(true);
    });

    it('rejects config without encryptionKey', () => {
      const result = pluginConfig.safeParse({});
      expect(result.success).toBe(false);
    });

    it('rejects encryptionKey shorter than 32 chars', () => {
      const result = pluginConfig.safeParse({ encryptionKey: 'short' });
      expect(result.success).toBe(false);
    });

    it('rejects invalid apiUrl', () => {
      const result = pluginConfig.safeParse({
        apiUrl: 'not-a-url',
        encryptionKey: '01234567890123456789012345678901',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('settingsConfig', () => {
    it('accepts valid settings', () => {
      const result = settingsConfig.safeParse({
        apiUrl: 'https://api.test.com',
        accessToken: 'token',
      });
      expect(result.success).toBe(true);
    });

    it('rejects missing apiUrl', () => {
      const result = settingsConfig.safeParse({ accessToken: 'token' });
      expect(result.success).toBe(false);
    });

    it('rejects missing accessToken', () => {
      const result = settingsConfig.safeParse({ apiUrl: 'https://api.test.com' });
      expect(result.success).toBe(false);
    });

    it('rejects empty accessToken', () => {
      const result = settingsConfig.safeParse({ apiUrl: 'https://api.test.com', accessToken: '' });
      expect(result.success).toBe(false);
    });
  });

  describe('schemaConfig', () => {
    const base = { encryptionKey: '01234567890123456789012345678901' };

    it('accepts config without engine', () => {
      const result = schemaConfig.safeParse(base);
      expect(result.success).toBe(true);
    });

    it('accepts memory engine', () => {
      const result = schemaConfig.safeParse({ ...base, engine: 'memory' });
      expect(result.success).toBe(true);
    });

    it('accepts redis engine with connection', () => {
      const result = schemaConfig.safeParse({
        ...base,
        engine: 'redis',
        connection: { host: 'localhost', port: 6379, db: 1 },
      });
      expect(result.success).toBe(true);
    });

    it('rejects redis engine without connection', () => {
      const result = schemaConfig.safeParse({ ...base, engine: 'redis' });
      expect(result.success).toBe(false);
    });

    it('rejects unsupported engine value', () => {
      const result = schemaConfig.safeParse({ ...base, engine: 'memcached' });
      expect(result.success).toBe(false);
    });
  });
});
