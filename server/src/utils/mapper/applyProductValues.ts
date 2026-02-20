import { set } from 'lodash';
import { ProductFieldsResult } from '../../@types/document.service';
import { ProductService } from '../../services/@types';

/**
 * Apply product values to the result
 */
export const applyProductValues = async <T extends object = any>(
  result: T,
  productFields: ProductFieldsResult,
  productService: ProductService
): Promise<T> => {
  const productsValues = await productService.getProductsById(Array.from(productFields.values()));
  if (!productsValues) {
    return result;
  }
  for (const [attribute, productId] of productFields) {
    const product = productsValues.get(productId);
    if (product) {
      set(result, attribute, {
        ...product,
        productId,
      });
    }
  }
  return result;
};
