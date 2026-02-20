import { getRestClient } from '../../clients/rest.client';
import type { StrapiContext } from '../../../@types';
import type { OpenMercatoRestProduct } from '../../@types';

describe('rest.client', () => {
  const mockConfig = {
    apiUrl: 'https://my-instance.openmercato.com',
    accessToken: 'test-token',
  };

  const mockAdminService = {
    getConfig: jest.fn().mockResolvedValue(mockConfig),
    isConfigured: jest.fn((config: any) => !!config?.apiUrl && !!config?.accessToken),
    updateConfig: jest.fn(),
    getStore: jest.fn(),
  };

  function createStrapiMock({ cacheService }: { cacheService: any }) {
    return {
      plugin: jest.fn().mockReturnValue({
        service: jest.fn((name: string) => {
          if (name === 'cache') return cacheService;
          if (name === 'admin') return mockAdminService;
          throw new Error('Unknown service: ' + name);
        }),
      }),
    } as unknown as StrapiContext['strapi'];
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('throws when plugin is not configured', async () => {
    // Arrange
    const cacheService = { get: jest.fn().mockResolvedValueOnce(undefined), set: jest.fn() };
    const unconfiguredAdminService = {
      ...mockAdminService,
      getConfig: jest.fn().mockResolvedValue(null),
    };
    const strapi = {
      plugin: jest.fn().mockReturnValue({
        service: jest.fn((name: string) => {
          if (name === 'cache') return cacheService;
          if (name === 'admin') return unconfiguredAdminService;
          throw new Error('Unknown service: ' + name);
        }),
      }),
    } as unknown as StrapiContext['strapi'];
    const client = getRestClient({ strapi });

    // Act & Assert
    await expect(client.fetchProductsByIds([1])).rejects.toThrow(
      'Open Mercato plugin is not configured'
    );
    await expect(client.searchProductsByName('test')).rejects.toThrow(
      'Open Mercato plugin is not configured'
    );
  });

  it('throws when config has missing apiUrl', async () => {
    // Arrange
    const cacheService = { get: jest.fn().mockResolvedValueOnce(undefined), set: jest.fn() };
    const partialAdminService = {
      ...mockAdminService,
      getConfig: jest.fn().mockResolvedValue({ accessToken: 'token' }),
    };
    const strapi = {
      plugin: jest.fn().mockReturnValue({
        service: jest.fn((name: string) => {
          if (name === 'cache') return cacheService;
          if (name === 'admin') return partialAdminService;
          throw new Error('Unknown service: ' + name);
        }),
      }),
    } as unknown as StrapiContext['strapi'];
    const client = getRestClient({ strapi });

    // Act & Assert
    await expect(client.fetchProductsByIds([1])).rejects.toThrow(
      'Open Mercato plugin is not configured'
    );
  });

  it('returns empty array if no ids are provided', async () => {
    // Arrange
    const cacheService = { get: jest.fn(), set: jest.fn() };
    const strapi = createStrapiMock({ cacheService });
    const client = getRestClient({ strapi });

    // Act
    const result = await client.fetchProductsByIds([]);

    // Assert
    expect(result).toEqual([]);
    expect(cacheService.get).not.toHaveBeenCalled();
  });

  it('returns cached products if all are cached', async () => {
    // Arrange
    const cachedProducts = [
      { id: 1, name: 'A', sku: 'a' },
      { id: 2, name: 'B', sku: 'b' },
    ];
    const cacheService = {
      get: jest
        .fn()
        .mockResolvedValueOnce(cachedProducts[0])
        .mockResolvedValueOnce(cachedProducts[1]),
      set: jest.fn(),
    };
    const fetchSpy = jest.spyOn(global, 'fetch' as any);
    const strapi = createStrapiMock({ cacheService });
    const client = getRestClient({ strapi });

    // Act
    const result = await client.fetchProductsByIds([1, 2]);

    // Assert
    expect(cacheService.get).toHaveBeenCalledTimes(2);
    expect(result).toEqual(cachedProducts);
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it('fetches missing products from API and caches them', async () => {
    // Arrange
    const cacheService = {
      get: jest
        .fn()
        .mockResolvedValueOnce({ id: 1, name: 'A', sku: 'a' })
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined),
      set: jest.fn(),
    };
    const apiProducts: OpenMercatoRestProduct[] = [
      { id: 2, name: 'B', sku: 'b' },
      { id: 3, name: 'C', sku: 'c' },
    ];
    const fetchSpy = jest.spyOn(global, 'fetch' as any).mockResolvedValue({
      ok: true,
      json: async () => ({ data: apiProducts }),
    } as any);
    const strapi = createStrapiMock({ cacheService });
    const client = getRestClient({ strapi });

    // Act
    const result = await client.fetchProductsByIds([1, 2, 3]);

    // Assert
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const calledUrl = fetchSpy.mock.calls[0][0] as string;
    expect(calledUrl).toContain('/entities/products');
    expect(cacheService.set).toHaveBeenCalledTimes(2);
    expect(result).toEqual([
      { id: 1, name: 'A', sku: 'a' },
      { id: 2, name: 'B', sku: 'b' },
      { id: 3, name: 'C', sku: 'c' },
    ]);
    fetchSpy.mockRestore();
  });

  it('throws if fetch fails', async () => {
    // Arrange
    const cacheService = { get: jest.fn().mockResolvedValueOnce(undefined), set: jest.fn() };
    const fetchSpy = jest
      .spyOn(global, 'fetch' as any)
      .mockResolvedValue({ ok: false, status: 500, statusText: 'Server Error' } as any);
    const strapi = createStrapiMock({ cacheService });
    const client = getRestClient({ strapi });

    // Act & Assert
    await expect(client.fetchProductsByIds([1])).rejects.toThrow(
      'Open Mercato REST API error: 500 Server Error'
    );
    fetchSpy.mockRestore();
  });

  it('calls the correct API URL from config', async () => {
    // Arrange
    const cacheService = { get: jest.fn().mockResolvedValueOnce(undefined), set: jest.fn() };
    const apiProducts: OpenMercatoRestProduct[] = [{ id: 1, name: 'A', sku: 'a' }];
    const fetchSpy = jest.spyOn(global, 'fetch' as any).mockResolvedValue({
      ok: true,
      json: async () => ({ data: apiProducts }),
    } as any);
    const strapi = createStrapiMock({ cacheService });
    const client = getRestClient({ strapi });

    // Act
    await client.fetchProductsByIds([1]);

    // Assert
    const calledUrl = fetchSpy.mock.calls[0][0] as string;
    expect(calledUrl).toMatch(/^https:\/\/my-instance\.openmercato\.com\/entities\/products/);
    fetchSpy.mockRestore();
  });

  it('sends Bearer token in Authorization header', async () => {
    // Arrange
    const cacheService = { get: jest.fn().mockResolvedValueOnce(undefined), set: jest.fn() };
    const apiProducts: OpenMercatoRestProduct[] = [{ id: 1, name: 'A', sku: 'a' }];
    const fetchSpy = jest.spyOn(global, 'fetch' as any).mockResolvedValue({
      ok: true,
      json: async () => ({ data: apiProducts }),
    } as any);
    const strapi = createStrapiMock({ cacheService });
    const client = getRestClient({ strapi });

    // Act
    await client.fetchProductsByIds([1]);

    // Assert
    const calledOptions = fetchSpy.mock.calls[0][1] as RequestInit;
    expect(calledOptions.headers).toEqual(
      expect.objectContaining({ Authorization: 'Bearer test-token' })
    );
    fetchSpy.mockRestore();
  });

  it('returns products in the order of input ids', async () => {
    // Arrange
    const cacheService = {
      get: jest
        .fn()
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce({ id: 1, name: 'A', sku: 'a' }),
      set: jest.fn(),
    };
    const apiProducts: OpenMercatoRestProduct[] = [{ id: 2, name: 'B', sku: 'b' }];
    const fetchSpy = jest.spyOn(global, 'fetch' as any).mockResolvedValue({
      ok: true,
      json: async () => ({ data: apiProducts }),
    } as any);
    const strapi = createStrapiMock({ cacheService });
    const client = getRestClient({ strapi });

    // Act
    const result = await client.fetchProductsByIds([2, 1]);

    // Assert
    expect(result.map((p) => p.id)).toEqual([2, 1]);
    fetchSpy.mockRestore();
  });

  it('handles partial cache hits', async () => {
    // Arrange
    const cacheService = {
      get: jest
        .fn()
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce({ id: 2, name: 'B', sku: 'b' })
        .mockResolvedValueOnce(undefined),
      set: jest.fn(),
    };
    const apiProducts: OpenMercatoRestProduct[] = [
      { id: 1, name: 'A', sku: 'a' },
      { id: 3, name: 'C', sku: 'c' },
    ];
    const fetchSpy = jest.spyOn(global, 'fetch' as any).mockResolvedValue({
      ok: true,
      json: async () => ({ data: apiProducts }),
    } as any);
    const strapi = createStrapiMock({ cacheService });
    const client = getRestClient({ strapi });

    // Act
    const result = await client.fetchProductsByIds([1, 2, 3]);

    // Assert
    expect(result.map((p) => p.id)).toEqual([1, 2, 3]);
    expect(cacheService.set).toHaveBeenCalledTimes(2);
    fetchSpy.mockRestore();
  });

  describe('searchProductsByName', () => {
    it('returns mapped products from REST API', async () => {
      // Arrange
      const cacheService = { get: jest.fn(), set: jest.fn() };
      const apiProducts: OpenMercatoRestProduct[] = [
        { id: 10, name: 'Gadget A', sku: 'ga' },
        { id: 20, name: 'Gadget B', sku: 'gb' },
      ];
      const fetchSpy = jest.spyOn(global, 'fetch' as any).mockResolvedValue({
        ok: true,
        json: async () => ({ data: apiProducts }),
      } as any);
      const strapi = createStrapiMock({ cacheService });
      const client = getRestClient({ strapi });

      // Act
      const result = await client.searchProductsByName('Gadget');

      // Assert
      expect(fetchSpy).toHaveBeenCalledTimes(1);
      const calledUrl = fetchSpy.mock.calls[0][0] as string;
      expect(calledUrl).toContain('/entities/products');
      expect(calledUrl).toContain('q=Gadget');
      expect(calledUrl).toContain('limit=10');
      expect(result).toEqual([
        { id: 10, name: 'Gadget A' },
        { id: 20, name: 'Gadget B' },
      ]);
      fetchSpy.mockRestore();
    });

    it('returns empty array when no products match', async () => {
      // Arrange
      const cacheService = { get: jest.fn(), set: jest.fn() };
      const fetchSpy = jest.spyOn(global, 'fetch' as any).mockResolvedValue({
        ok: true,
        json: async () => ({ data: [] }),
      } as any);
      const strapi = createStrapiMock({ cacheService });
      const client = getRestClient({ strapi });

      // Act
      const result = await client.searchProductsByName('nonexistent');

      // Assert
      expect(result).toEqual([]);
      fetchSpy.mockRestore();
    });

    it('throws if fetch fails', async () => {
      // Arrange
      const cacheService = { get: jest.fn(), set: jest.fn() };
      const fetchSpy = jest
        .spyOn(global, 'fetch' as any)
        .mockResolvedValue({ ok: false, status: 500, statusText: 'Server Error' } as any);
      const strapi = createStrapiMock({ cacheService });
      const client = getRestClient({ strapi });

      // Act & Assert
      await expect(client.searchProductsByName('fail')).rejects.toThrow(
        'Open Mercato REST API error: 500 Server Error'
      );
      fetchSpy.mockRestore();
    });
  });
});
