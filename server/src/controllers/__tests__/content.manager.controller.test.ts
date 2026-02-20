import { StrapiContext } from '../../@types';
import type { RequestContext } from '../../@types/koa';
import contentManagerController from '../content.manager.controller';
import * as utils from '../../utils';

jest.mock('../../utils', () => ({
  ...jest.requireActual('../../utils'),
  __esModule: true,
}));

const configuredAdminService = {
  getConfig: jest.fn().mockResolvedValue({ apiUrl: 'https://api.test.com', accessToken: 'tok' }),
  isConfigured: jest.fn().mockReturnValue(true),
};

const unconfiguredAdminService = {
  getConfig: jest.fn().mockResolvedValue(null),
  isConfigured: jest.fn().mockReturnValue(false),
};

const createMockServices = (
  overrides: { searchProducts?: jest.Mock; adminService?: any } = {}
) => {
  const productService = {
    searchProducts: overrides.searchProducts ?? jest.fn().mockResolvedValue([]),
  };
  const adminService = overrides.adminService ?? configuredAdminService;
  return (_strapi: any, name: string) => {
    if (name === 'products') return productService;
    if (name === 'admin') return adminService;
    throw new Error('Unknown service: ' + name);
  };
};

const getMockStrapi = () => ({}) as unknown as StrapiContext['strapi'];

const getMockCtx = ({
  body,
  query,
  badRequest,
}: { body?: any; query?: any; badRequest?: jest.Mock } = {}) => {
  return {
    body: body ?? undefined,
    query: query ?? {},
    badRequest: badRequest ?? jest.fn(),
  } as unknown as RequestContext;
};

describe('content.manager.controller', () => {
  beforeEach(jest.restoreAllMocks);

  describe('isConfigured', () => {
    it('should return configured: true when plugin is configured', async () => {
      // Arrange
      jest.spyOn(utils, 'getService').mockImplementation(
        createMockServices({ adminService: configuredAdminService }) as any
      );
      const mockCtx = getMockCtx();
      const controller = contentManagerController({ strapi: getMockStrapi() });

      // Act
      await controller.isConfigured(mockCtx);

      // Assert
      expect(mockCtx.body).toEqual({ configured: true });
    });

    it('should return configured: false when plugin is not configured', async () => {
      // Arrange
      jest.spyOn(utils, 'getService').mockImplementation(
        createMockServices({ adminService: unconfiguredAdminService }) as any
      );
      const mockCtx = getMockCtx();
      const controller = contentManagerController({ strapi: getMockStrapi() });

      // Act
      await controller.isConfigured(mockCtx);

      // Assert
      expect(mockCtx.body).toEqual({ configured: false });
    });
  });

  describe('getProducts', () => {
    it('should return empty products when plugin is not configured', async () => {
      // Arrange
      jest.spyOn(utils, 'getService').mockImplementation(
        createMockServices({ adminService: unconfiguredAdminService }) as any
      );
      const mockCtx = getMockCtx({ query: { q: 'test' } });
      const controller = contentManagerController({ strapi: getMockStrapi() });

      // Act
      await controller.getProducts(mockCtx);

      // Assert
      expect(mockCtx.body).toEqual({ products: [] });
    });

    it('should return products when valid query is provided', async () => {
      // Arrange
      const mockProducts = [{ id: 1, title: 'Product 1' }];
      jest.spyOn(utils, 'getService').mockImplementation(
        createMockServices({ searchProducts: jest.fn().mockResolvedValue(mockProducts) }) as any
      );

      const mockCtx = getMockCtx({ query: { q: 'test' } });

      // Act
      const controller = contentManagerController({ strapi: getMockStrapi() });
      await controller.getProducts(mockCtx);

      // Assert
      expect(mockCtx.body).toEqual({ products: mockProducts });
    });

    it('should return bad request when query is too short', async () => {
      // Arrange
      jest.spyOn(utils, 'getService').mockImplementation(createMockServices() as any);
      const mockBadRequest = jest.fn();
      const mockCtx = getMockCtx({ query: { q: 't' }, badRequest: mockBadRequest });

      // Act
      const controller = contentManagerController({ strapi: getMockStrapi() });
      await controller.getProducts(mockCtx);

      // Assert
      expect(mockBadRequest).toHaveBeenCalled();
      expect(mockBadRequest).toHaveBeenCalledWith(
        expect.stringContaining('must contain at least 3 character'),
        expect.objectContaining({ issues: expect.anything() })
      );
    });

    it('should return bad request when query is missing', async () => {
      // Arrange
      jest.spyOn(utils, 'getService').mockImplementation(createMockServices() as any);
      const mockBadRequest = jest.fn();
      const mockCtx = getMockCtx({ query: {}, badRequest: mockBadRequest });

      // Act
      const controller = contentManagerController({ strapi: getMockStrapi() });
      await controller.getProducts(mockCtx);

      // Assert
      expect(mockBadRequest).toHaveBeenCalled();
      expect(mockBadRequest).toHaveBeenCalledWith(
        expect.stringContaining('Required'),
        expect.objectContaining({ issues: expect.anything() })
      );
    });

    it('should call productService.searchProducts with the correct query parameter', async () => {
      // Arrange
      const mockSearchProducts = jest.fn().mockResolvedValue([]);
      jest.spyOn(utils, 'getService').mockImplementation(
        createMockServices({ searchProducts: mockSearchProducts }) as any
      );
      const mockCtx = getMockCtx({ query: { q: 'test-query' } });

      // Act
      const controller = contentManagerController({ strapi: getMockStrapi() });
      await controller.getProducts(mockCtx);

      // Assert
      expect(mockSearchProducts).toHaveBeenCalledWith('test-query');
    });

    it('should handle errors from productService.searchProducts', async () => {
      // Arrange
      const mockSearchProducts = jest.fn().mockRejectedValue(new Error('Service error'));
      jest.spyOn(utils, 'getService').mockImplementation(
        createMockServices({ searchProducts: mockSearchProducts }) as any
      );
      const mockCtx = getMockCtx({ query: { q: 'test' } });

      // Act & Assert
      const controller = contentManagerController({ strapi: getMockStrapi() });
      await expect(controller.getProducts(mockCtx)).rejects.toThrow('Service error');
    });

    it('should return bad request when q is not a string', async () => {
      // Arrange
      jest.spyOn(utils, 'getService').mockImplementation(createMockServices() as any);
      const mockBadRequest = jest.fn();
      const mockCtx = getMockCtx({ query: { q: 123 }, badRequest: mockBadRequest });

      // Act
      const controller = contentManagerController({ strapi: getMockStrapi() });
      await controller.getProducts(mockCtx);

      // Assert
      expect(mockBadRequest).toHaveBeenCalled();
      expect(mockBadRequest).toHaveBeenCalledWith(
        expect.stringContaining('Expected string'),
        expect.objectContaining({ issues: expect.anything() })
      );
    });

    it('should return empty array when no products are found', async () => {
      // Arrange
      jest.spyOn(utils, 'getService').mockImplementation(
        createMockServices({ searchProducts: jest.fn().mockResolvedValue([]) }) as any
      );
      const mockCtx = getMockCtx({ query: { q: 'no-results-query' } });

      // Act
      const controller = contentManagerController({ strapi: getMockStrapi() });
      await controller.getProducts(mockCtx);

      // Assert
      expect(mockCtx.body).toEqual({ products: [] });
    });

    it('should handle exactly minimum length query (3 characters)', async () => {
      // Arrange
      const mockProducts = [{ id: 1, title: 'Product 1' }];
      const mockSearchProducts = jest.fn().mockResolvedValue(mockProducts);
      jest.spyOn(utils, 'getService').mockImplementation(
        createMockServices({ searchProducts: mockSearchProducts }) as any
      );
      const mockCtx = getMockCtx({ query: { q: 'abc' } });

      // Act
      const controller = contentManagerController({ strapi: getMockStrapi() });
      await controller.getProducts(mockCtx);

      // Assert
      expect(mockSearchProducts).toHaveBeenCalledWith('abc');
      expect(mockCtx.body).toEqual({ products: mockProducts });
    });
  });
});
