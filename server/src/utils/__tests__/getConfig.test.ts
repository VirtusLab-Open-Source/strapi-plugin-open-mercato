import { getENVConfig } from '../getENVConfig';
import { Core } from '@strapi/strapi';
import { FullPluginConfig } from '../../config/schema';

const getMockConfig = (): FullPluginConfig => ({
  encryptionKey: '01234567890123456789012345678901',
});

const getMockConfigWithCache = (): FullPluginConfig => ({
  engine: 'memory',
  apiUrl: 'https://my-instance.openmercato.com',
  accessToken: 'test-access-token',
  encryptionKey: '01234567890123456789012345678901',
});

const getStrapiMock = (mockConfig: FullPluginConfig = getMockConfig()) => {
  return {
    config: {
      get: jest.fn().mockReturnValue(mockConfig),
    },
  } as unknown as Core.Strapi;
};

describe('getENVConfig', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return the plugin configuration', () => {
    const mockConfig = getMockConfig();
    const mockStrapi = getStrapiMock(mockConfig);

    const result = getENVConfig(mockStrapi);

    expect(mockStrapi.config.get).toHaveBeenCalledWith('plugin::open-mercato');
    expect(result).toBe(mockConfig);
  });

  it('should work with minimal config (no cache engine)', () => {
    const mockConfig = getMockConfig();
    const mockStrapi = getStrapiMock(mockConfig);

    const result = getENVConfig(mockStrapi);

    expect(result).toHaveProperty('encryptionKey');
    expect(result.engine).toBeUndefined();
  });

  it('should return the correct configuration with memory engine', () => {
    const mockConfig = getMockConfigWithCache();
    const mockStrapi = getStrapiMock(mockConfig);

    const result = getENVConfig(mockStrapi);

    expect(result).toHaveProperty('apiUrl');
    expect(result).toHaveProperty('accessToken');
    expect(result.engine).toBe('memory');
  });

  it('should work with redis engine configuration', () => {
    const redisConfig: FullPluginConfig = {
      engine: 'redis',
      apiUrl: 'https://my-instance.openmercato.com',
      accessToken: 'test-access-token',
      encryptionKey: '01234567890123456789012345678901',
      connection: {
        host: 'localhost',
        port: 6379,
        db: 0,
        password: 'password',
        username: 'user',
      },
    } as FullPluginConfig;
    const mockStrapi = getStrapiMock(redisConfig);

    const result = getENVConfig(mockStrapi);

    expect(result.engine).toBe('redis');
    if (result.engine === 'redis') {
      expect(result.connection).toHaveProperty('host');
      expect(result.connection).toHaveProperty('port');
      expect(result.connection).toHaveProperty('db');
    }
  });
});
