import { adminService } from '../admin.service';
import type { StrapiContext } from '../../@types';

jest.mock('../../utils', () => ({
  getENVConfig: jest.fn().mockReturnValue({
    encryptionKey: '01234567890123456789012345678901',
  }),
}));

jest.mock('../../utils/encrypt', () => ({
  encryptConfig: jest.fn((config) => ({ ...config, accessToken: `enc:${config.accessToken}` })),
  decryptConfig: jest.fn((config) => ({
    ...config,
    accessToken: config.accessToken?.replace('enc:', ''),
  })),
}));

const createMockStore = (initialData: Record<string, any> = {}) => {
  const data: Record<string, any> = { ...initialData };
  return {
    get: jest.fn(({ key }: { key: string }) => Promise.resolve(data[key] ?? null)),
    set: jest.fn(({ key, value }: { key: string; value: any }) => {
      data[key] = value;
      return Promise.resolve();
    }),
  };
};

const createMockStrapi = (store: ReturnType<typeof createMockStore>) =>
  ({
    store: jest.fn().mockReturnValue(store),
    config: {
      get: jest.fn().mockReturnValue({
        encryptionKey: '01234567890123456789012345678901',
      }),
    },
  }) as unknown as StrapiContext['strapi'];

describe('admin.service', () => {
  beforeEach(jest.clearAllMocks);

  describe('getConfig', () => {
    it('returns null when no config stored', async () => {
      const store = createMockStore();
      const service = adminService({ strapi: createMockStrapi(store) });

      const config = await service.getConfig();

      expect(config).toBeNull();
    });

    it('returns decrypted config when stored', async () => {
      const store = createMockStore({
        store_config: {
          apiUrl: 'https://api.test.com',
          accessToken: 'enc:my-token',
        },
      });
      const service = adminService({ strapi: createMockStrapi(store) });

      const config = await service.getConfig();

      expect(config).toEqual({
        apiUrl: 'https://api.test.com',
        accessToken: 'my-token',
      });
    });
  });

  describe('isConfigured', () => {
    it('returns false for null', () => {
      const store = createMockStore();
      const service = adminService({ strapi: createMockStrapi(store) });

      expect(service.isConfigured(null)).toBe(false);
    });

    it('returns false when apiUrl missing', () => {
      const store = createMockStore();
      const service = adminService({ strapi: createMockStrapi(store) });

      expect(service.isConfigured({ encryptionKey: 'x'.repeat(32), accessToken: 'tok' })).toBe(false);
    });

    it('returns false when accessToken missing', () => {
      const store = createMockStore();
      const service = adminService({ strapi: createMockStrapi(store) });

      expect(service.isConfigured({ encryptionKey: 'x'.repeat(32), apiUrl: 'https://a.com' })).toBe(false);
    });

    it('returns true when both apiUrl and accessToken present', () => {
      const store = createMockStore();
      const service = adminService({ strapi: createMockStrapi(store) });

      expect(
        service.isConfigured({
          encryptionKey: 'x'.repeat(32),
          apiUrl: 'https://a.com',
          accessToken: 'tok',
        })
      ).toBe(true);
    });
  });

  describe('updateConfig', () => {
    it('encrypts and stores config', async () => {
      const store = createMockStore();
      const service = adminService({ strapi: createMockStrapi(store) });

      const input = { apiUrl: 'https://api.test.com', accessToken: 'my-token' };
      const result = await service.updateConfig(input);

      expect(result).toEqual(input);
      expect(store.set).toHaveBeenCalledWith(
        expect.objectContaining({
          key: 'store_config',
          value: expect.objectContaining({ accessToken: 'enc:my-token' }),
        })
      );
    });

    it('merges with existing config', async () => {
      const store = createMockStore({
        store_config: { existing: 'value', accessToken: 'enc:old' },
      });
      const service = adminService({ strapi: createMockStrapi(store) });

      await service.updateConfig({ apiUrl: 'https://new.com', accessToken: 'new-token' });

      expect(store.set).toHaveBeenCalledWith(
        expect.objectContaining({
          value: expect.objectContaining({
            existing: 'value',
            apiUrl: 'https://new.com',
            accessToken: 'enc:new-token',
          }),
        })
      );
    });
  });

  describe('getStore', () => {
    it('returns the store instance', () => {
      const store = createMockStore();
      const service = adminService({ strapi: createMockStrapi(store) });

      expect(service.getStore()).toBe(store);
    });
  });
});
