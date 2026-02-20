import { getFetchClient } from '@strapi/strapi/admin';
import { useQuery } from '@tanstack/react-query';

import { getApiClient } from '../api/client';

export const useReadShopProducts = (input: { query: string; enabled?: boolean }) => {
  const fetch = getFetchClient();
  const { readShopProducts, getReadShopProductsIndex } = getApiClient(fetch);

  return useQuery({
    queryKey: getReadShopProductsIndex(input),
    queryFn: () => readShopProducts(input),
    enabled: input.enabled !== false && input.query.length > 2,
  });
};
