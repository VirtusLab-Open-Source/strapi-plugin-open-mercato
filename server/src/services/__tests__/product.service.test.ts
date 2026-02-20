import productsService from '../products.service';
import type { StrapiContext } from '../../@types';
import { getService as originalGetService } from '../../utils';

jest.mock('../../utils', () => ({
  ...jest.requireActual('../../utils'),
  getService: jest.fn(),
}));

const getMockStrapi = () => ({}) as unknown as StrapiContext['strapi'];

describe('products.service', () => {
  const mockGetService = require('../../utils').getService as jest.Mock;
  let mockRestClient: any;
  let mockOpenMercatoService: any;
  let strapi: StrapiContext['strapi'];

  beforeEach(() => {
    jest.clearAllMocks();
    strapi = getMockStrapi();
    mockRestClient = {
      fetchProductsByIds: jest.fn(),
      searchProductsByName: jest.fn(),
    };
    mockOpenMercatoService = {
      getRestClient: jest.fn(() => mockRestClient),
    };
    mockGetService.mockImplementation((_strapi, name) => {
      if (name === 'open-mercato') return mockOpenMercatoService;
      throw new Error('Unknown service: ' + name);
    });
  });

  describe('getProductsById', () => {
    it('returns a map of products by id', async () => {
      const inputIds = [1, 2];
      const products = [
        { id: 1, name: 'A' },
        { id: 2, name: 'B' },
      ];
      mockRestClient.fetchProductsByIds.mockResolvedValue(products);
      const service = productsService({ strapi });
      const result = await service.getProductsById(inputIds);
      expect(mockOpenMercatoService.getRestClient).toHaveBeenCalled();
      expect(mockRestClient.fetchProductsByIds).toHaveBeenCalledWith(inputIds);
      expect(result).toBeInstanceOf(Map);
      expect(result.size).toBe(2);
      expect(result.get(1)).toEqual(products[0]);
      expect(result.get(2)).toEqual(products[1]);
    });

    it('returns an empty map if no products are returned', async () => {
      mockRestClient.fetchProductsByIds.mockResolvedValue([]);
      const service = productsService({ strapi });
      const result = await service.getProductsById([1, 2]);
      expect(result).toBeInstanceOf(Map);
      expect(result.size).toBe(0);
    });

    it('handles empty input array', async () => {
      mockRestClient.fetchProductsByIds.mockResolvedValue([]);
      const service = productsService({ strapi });
      const result = await service.getProductsById([]);
      expect(mockRestClient.fetchProductsByIds).toHaveBeenCalledWith([]);
      expect(result).toBeInstanceOf(Map);
      expect(result.size).toBe(0);
    });

    it('propagates errors from fetchProductsByIds', async () => {
      mockRestClient.fetchProductsByIds.mockRejectedValue(new Error('fail'));
      const service = productsService({ strapi });
      await expect(service.getProductsById([1])).rejects.toThrow('fail');
    });
  });

  describe('searchProducts', () => {
    it('returns search results from REST client', async () => {
      const query = 'shoes';
      const results = [{ id: 1, name: 'Shoe' }];
      mockRestClient.searchProductsByName.mockResolvedValue(results);
      const service = productsService({ strapi });
      const res = await service.searchProducts(query);
      expect(mockOpenMercatoService.getRestClient).toHaveBeenCalled();
      expect(mockRestClient.searchProductsByName).toHaveBeenCalledWith(query);
      expect(res).toBe(results);
    });

    it('handles empty search result', async () => {
      mockRestClient.searchProductsByName.mockResolvedValue([]);
      const service = productsService({ strapi });
      const res = await service.searchProducts('anything');
      expect(res).toEqual([]);
    });

    it('propagates errors from searchProductsByName', async () => {
      mockRestClient.searchProductsByName.mockRejectedValue(new Error('fail'));
      const service = productsService({ strapi });
      await expect(service.searchProducts('fail')).rejects.toThrow('fail');
    });
  });
});
