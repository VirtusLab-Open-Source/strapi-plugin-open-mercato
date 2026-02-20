import { difference } from 'lodash';
import { getService } from '../../utils';
import { StrapiContext } from '../../@types';
import { OpenMercatoRestProduct } from '../@types';
import { OpenMercatoRestProductResponse } from '../@types';

export const getRestClient = ({ strapi }: StrapiContext) => {
  const adminService = getService(strapi, 'admin');
  const cacheService = getService(strapi, 'cache');

  const getAuthHeaders = (accessToken: string) => {
    return {
      'X-Api-Key': accessToken,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    };
  };

  const restRequest = async <T>(path: string, params?: Record<string, any>): Promise<T> => {
    const config = await adminService.getConfig();
    if (!config?.apiUrl || !config?.accessToken) {
      throw new Error('Open Mercato plugin is not configured. Set API URL and Access Token in Settings.');
    }
    const baseUrl = config.apiUrl.replace(/\/+$/, '');
    const apiBaseUrl = baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;
    const url = new URL(`${apiBaseUrl}${path}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          url.searchParams.append(key, value.join(','));
        } else if (value !== undefined) {
          url.searchParams.append(key, String(value));
        }
      });
    }
    const res = await fetch(url.toString(), {
      headers: getAuthHeaders(config.accessToken),
    });
    if (!res.ok) {
      throw new Error(`Open Mercato REST API error: ${res.status} ${res.statusText}`);
    }
    const json = (await res.json()) as T;
    return json;
  };

  const getCacheKey = (id: string) => `open-mercato:product:${id}`;

  const fetchProductsByIds = async (ids: string[]) => {
    if (!ids.length) return [];
    const cacheKeys = ids.map(getCacheKey);
    const cachedResults = await Promise.all(
      cacheKeys.map((key) => cacheService.get<OpenMercatoRestProduct>(key))
    );

    const cachedProducts: Record<string, OpenMercatoRestProduct> = {};
    const cachedIds: string[] = cachedResults
      .map((product) => {
        if (product) {
          cachedProducts[product.id] = product;
          return product.id;
        }
      })
      .filter(Boolean);
    const missingIds = difference(ids, cachedIds);

    let fetchedProducts: OpenMercatoRestProduct[] = [];
    if (missingIds.length) {
      const data = await restRequest<OpenMercatoRestProductResponse>('/catalog/products', {
        id: missingIds,
      });
      fetchedProducts = data.items as OpenMercatoRestProduct[];
      await Promise.all(
        fetchedProducts.map((product) => cacheService.set(getCacheKey(product.id), product))
      );
    }
    return ids
      .map((id) => cachedProducts[id] || fetchedProducts.find((p) => p.id === id))
      .filter(Boolean) as OpenMercatoRestProduct[];
  };

  const searchProductsByName = async (
    nameFragment: string
  ): Promise<Pick<OpenMercatoRestProduct, 'id' | 'title' | 'default_media_url'>[]> => {
    const config = await adminService.getConfig();
    const data = await restRequest<OpenMercatoRestProductResponse>('/catalog/products', {
      search: nameFragment,
      limit: 10,
    });
    return data.items.map((p) => ({ 
      id: p.id, 
      title: p.title, 
      default_media_url: `${config.apiUrl.replace(/\/api$/, '')}${p.default_media_url}`
    }));
  };

  return {
    fetchProductsByIds,
    searchProductsByName,
  };
};
