import { getFetchClient } from '@strapi/strapi/admin';
import { useQuery } from '@tanstack/react-query';

import { getApiClient } from '../api/client';

export const useIsPluginConfigured = () => {
  const fetch = getFetchClient();
  const { isConfigured, getIsConfiguredIndex } = getApiClient(fetch);

  return useQuery({
    queryKey: getIsConfiguredIndex(),
    queryFn: isConfigured,
    staleTime: 30_000,
  });
};
