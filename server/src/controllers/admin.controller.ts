import { StrapiContext } from '../@types';
import { getService } from '../utils';
import type { RequestContext } from '../@types/koa';
import { settingsConfig } from '../config/schema';
import { validate } from '../validators/utils';
import { either } from 'fp-ts';

const adminController = ({ strapi }: StrapiContext) => {
  const adminService = getService(strapi, 'admin');
  const partialHideValue = (value: string) =>
    `${value.substring(0, 3)}*****${value.substring(value.length - 1)}`;

  return {
    async getConfig(ctx: RequestContext) {
      const adminConfig = await adminService.getConfig();

      if (adminService.isConfigured(adminConfig)) {
        ctx.body = {
          apiUrl: adminConfig.apiUrl,
          accessToken: partialHideValue(adminConfig.accessToken),
          configured: true,
        };
      } else {
        ctx.body = { apiUrl: '', accessToken: '', configured: false };
      }

      return ctx;
    },
    async updateConfig(ctx: RequestContext) {
      const config = validate(settingsConfig.safeParse(ctx.request.body));

      if (either.isLeft(config)) {
        return ctx.badRequest(config.left.message, {
          issues: config.left.issues,
        });
      }

      ctx.body = await adminService.updateConfig(config.right);
      return ctx;
    },
  };
};

export default adminController;
export type AdminController = ReturnType<typeof adminController>;
