import { getFetchClient } from '@strapi/strapi/admin';
import { useMutation, useQuery } from '@tanstack/react-query';
import { PLUGIN_ID } from '../pluginId';
import { FetchSettingsFormSchema, fetchSettingsSchema, ReqSettingsFormSchema } from '../validators/settings.validator';

export const useSettings = () => {
  const fetch = getFetchClient();

  return useQuery({
    queryKey: ['get-settings', PLUGIN_ID],
    queryFn: () =>
      fetch.get<{ data: FetchSettingsFormSchema }>(`/${PLUGIN_ID}/settings`)
           .then((res) => fetchSettingsSchema.parse(res.data)),
  });
};

export const useSaveSettings = () => {
  const fetch = getFetchClient();
  return useMutation({
    mutationKey: ['save-settings', PLUGIN_ID],
    mutationFn: (settings: ReqSettingsFormSchema) =>
      fetch.put(`/${PLUGIN_ID}/settings`, settings)
           .then((res) => fetchSettingsSchema.parse(res.data)),
  });
};
