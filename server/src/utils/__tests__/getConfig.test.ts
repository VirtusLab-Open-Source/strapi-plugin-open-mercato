import { getENVConfig } from '../getENVConfig';
import { Core } from '@strapi/strapi';
import { FullPluginConfig, RedisEngine } from '../../config/schema';

const getMockConfig = (): FullPluginConfig => ({
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

const isRedisEngine = (config: FullPluginConfig): config is RedisEngine & { host: string } => {
  return config.engine === 'redis';
};

describe('getENVConfig', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return the plugin configuration', () => {
    // Arrange
    const mockConfig = getMockConfig();
    const mockStrapi = getStrapiMock(mockConfig);

    // Act
    const result = getENVConfig(mockStrapi);

    // Assert
    expect(mockStrapi.config.get).toHaveBeenCalledWith('plugin::open-mercato');
    expect(result).toBe(mockConfig);
  });

  it('should return the correct configuration structure', () => {
    // Arrange
    const mockConfig = getMockConfig();
    const mockStrapi = getStrapiMock(mockConfig);

    // Act
    const result = getENVConfig(mockStrapi);

    // Assert
    expect(result).toHaveProperty('apiUrl');
    expect(result).toHaveProperty('accessToken');
    expect(result).toHaveProperty('engine');
    expect(result.engine).toBe('memory');
  });

  it('should work with redis engine configuration', () => {
    // Arrange
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

    // Act
    const result = getENVConfig(mockStrapi);

    // Assert
    expect(result).toHaveProperty('apiUrl');
    expect(result).toHaveProperty('engine');
    expect(result.engine).toBe('redis');

    if (isRedisEngine(result)) {
      expect(result.connection).toHaveProperty('host');
      expect(result.connection).toHaveProperty('port');
      expect(result.connection).toHaveProperty('db');
      expect(result.connection).toHaveProperty('password');
      expect(result.connection).toHaveProperty('username');
    }
  });
});
