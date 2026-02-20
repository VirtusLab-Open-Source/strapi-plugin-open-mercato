import { getService } from '../getService';
import { Core } from '@strapi/strapi';
import { Services } from '../../services';

const getMockService = (): Record<string, jest.Mock> => ({
  someMethod: jest.fn(),
});

const getStrapiMock = (mockService: Record<string, jest.Mock> = getMockService()) => {
  const mockPlugin = {
    service: jest.fn().mockReturnValue(mockService),
  };

  return {
    plugin: jest.fn().mockReturnValue(mockPlugin),
  } as unknown as Core.Strapi;
};

describe('getService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return the requested service', () => {
    // Arrange
    const mockService = getMockService();
    const mockStrapi = getStrapiMock(mockService);
    const serviceName: keyof Services = 'open-mercato';

    // Act
    const result = getService(mockStrapi, serviceName);

    // Assert

    expect(mockStrapi.plugin).toHaveBeenCalledWith('open-mercato');
    expect(mockStrapi.plugin('open-mercato').service).toHaveBeenCalledWith(serviceName);
    expect(result).toBe(mockService);
  });

  it.each(['products', 'cache', 'open-mercato'] as const)(
    'should work with service name: %s',
    (serviceName) => {
      // Arrange
      const mockService = getMockService();
      const mockStrapi = getStrapiMock(mockService);

      // Act
      const result = getService(mockStrapi, serviceName);

      // Assert
      expect(mockStrapi.plugin('open-mercato').service).toHaveBeenCalledWith(serviceName);
      expect(result).toBe(mockService);
    }
  );
});
