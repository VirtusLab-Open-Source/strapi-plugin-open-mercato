import { Core } from '@strapi/strapi';
import { setupPermissions } from './permissions';
import { getService } from './utils';
import { getENVConfig } from './utils';

const bootstrap = async ({ strapi }: { strapi: Core.Strapi }) => {
  const adminService = getService(strapi, 'admin');
  const storedConfig = await adminService.getConfig();

  if (!adminService.isConfigured(storedConfig)) {
    const envConfig = getENVConfig(strapi);
    if (envConfig.apiUrl && envConfig.accessToken) {
      await adminService.updateConfig({
        apiUrl: envConfig.apiUrl,
        accessToken: envConfig.accessToken,
      });
    }
  }

  await setupPermissions({ strapi });
};

export default bootstrap;
