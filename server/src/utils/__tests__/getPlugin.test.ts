import { Core } from '@strapi/strapi';
import { getPlugin } from '../getPlugin';

const getStrapiMock = (): Core.Strapi =>
  ({
    plugin: jest.fn().mockReturnValue({
      service: jest.fn(),
    }),
  }) as unknown as Core.Strapi;

describe('getPlugin', () => {
  it('should retrieve the open-mercato plugin instance', () => {
    // Arrange
    const mockStrapi = getStrapiMock();

    // Act
    const result = getPlugin(mockStrapi);

    // Assert
    expect(mockStrapi.plugin).toHaveBeenCalledWith('open-mercato');
    expect(result).toBeDefined();
    expect(result.service).toBeDefined();
  });
});
