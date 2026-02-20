import { snakeCase } from 'lodash';
import { StrapiContext } from '../@types';
import { FullPluginConfig, PluginConfig, SettingsConfig } from '../config/schema';
import { PLUGIN_ID } from '../const';
import { getENVConfig } from '../utils';
import { decryptConfig, encryptConfig } from '../utils/encrypt';

const CONFIG_KEY = 'store_config';
export const adminService = ({ strapi }: StrapiContext) => {
  const { encryptionKey } = getENVConfig(strapi);
  const store = strapi.store({
    type: 'plugin',
    name: snakeCase(PLUGIN_ID),
  });
  return {
    getStore() {
      return store;
    },
    async getConfig(): Promise<PluginConfig | null> {
      const config = await store.get({
        key: CONFIG_KEY,
      });
      if (!config) return null;
      return decryptConfig(config as PluginConfig, encryptionKey);
    },
    isConfigured(config: PluginConfig | null): config is PluginConfig & Required<SettingsConfig> {
      return !!config?.apiUrl && !!config?.accessToken;
    },
    async updateConfig(config: SettingsConfig) {
      const oldConfig: FullPluginConfig | null = await this.getStore().get({
        key: CONFIG_KEY,
      });
      await this.getStore().set({
        key: CONFIG_KEY,
        value: encryptConfig(
          {
            ...oldConfig,
            ...config,
          },
          encryptionKey
        ),
      });
      return config;
    },
  };
};

export default adminService;
export type AdminService = ReturnType<typeof adminService>;
