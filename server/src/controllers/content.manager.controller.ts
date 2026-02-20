import { either } from 'fp-ts';
import { z } from 'zod';
import { StrapiContext } from '../@types';
import type { RequestContext } from '../@types/koa';
import { getService } from '../utils';
import { validate } from '../validators/utils';

const getQueryVendorsValidator = (query: unknown) => {
  return validate(
    z
      .object({
        q: z.string().min(3),
      })
      .safeParse(query)
  );
};

const getContentManagerController = ({ strapi }: StrapiContext) => {
  const productService = getService(strapi, 'products');
  const adminService = getService(strapi, 'admin');

  return {
    async isConfigured(ctx: RequestContext) {
      const config = await adminService.getConfig();
      ctx.body = { configured: adminService.isConfigured(config) };
    },

    async getProducts(ctx: RequestContext) {
      const config = await adminService.getConfig();
      if (!adminService.isConfigured(config)) {
        ctx.body = { products: [] };
        return;
      }

      const validator = getQueryVendorsValidator(ctx.query);
      if (either.isLeft(validator)) {
        return ctx.badRequest(validator.left.message, {
          issues: validator.left.issues,
        });
      }
      const { q } = validator.right;
      ctx.body = {
        products: await productService.searchProducts(q),
      };
    },
  };
};
export default getContentManagerController;
