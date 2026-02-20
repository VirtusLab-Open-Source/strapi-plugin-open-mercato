import type { StrapiContext } from '../@types';
import { getService } from '../utils';
import { ProductService } from './@types';

export type Product = string;
const productsService = ({ strapi }: StrapiContext): ProductService => {
  const openMercatoService = getService(strapi, 'open-mercato');

  return {
    async getProductsById(productIds: string[]) {
      const products = await openMercatoService.getRestClient().fetchProductsByIds(productIds);
      return new Map(products.map((p) => [p.id, p]));
    },
    async searchProducts(query: string) {
      return openMercatoService.getRestClient().searchProductsByName(query);
    },
  };
};

export default productsService;
export type ProductsService = ReturnType<typeof productsService>;
