import { applyProductValues } from '../applyProductValues';
import { ProductFieldsResult } from '../../../@types/document.service';

const createMockProductService = (products: Map<string, any>) => ({
  getProductsById: jest.fn().mockResolvedValue(products),
  searchProducts: jest.fn(),
});

describe('applyProductValues', () => {
  it('applies product values to flat fields', async () => {
    const result = { openMercatoProduct: { productId: '10' } };
    const productFields: ProductFieldsResult = new Map([['openMercatoProduct', '10']]);
    const products = new Map([['10', { id: '10', title: 'Product A', sku: 'SKU-A' }]]);
    const productService = createMockProductService(products);

    const applied = await applyProductValues(result, productFields, productService);

    expect(applied.openMercatoProduct).toEqual({
      id: '10',
      title: 'Product A',
      sku: 'SKU-A',
      productId: '10',
    });
    expect(productService.getProductsById).toHaveBeenCalledWith(['10']);
  });

  it('returns original result when productsValues is null/undefined', async () => {
    const result = { field: 'value' };
    const productFields: ProductFieldsResult = new Map([['field', '1']]);
    const productService = createMockProductService(null as any);

    const applied = await applyProductValues(result, productFields, productService);

    expect(applied).toEqual(result);
  });

  it('handles multiple product fields', async () => {
    const result = { productA: {}, productB: {} };
    const productFields: ProductFieldsResult = new Map([
      ['productA', '1'],
      ['productB', '2'],
    ]);
    const products = new Map([
      ['1', { id: '1', title: 'A' }],
      ['2', { id: '2', title: 'B' }],
    ]);
    const productService = createMockProductService(products);

    const applied = await applyProductValues(result, productFields, productService);

    expect(applied.productA).toEqual({ id: '1', title: 'A', productId: '1' });
    expect(applied.productB).toEqual({ id: '2', title: 'B', productId: '2' });
  });

  it('skips fields where product is not found', async () => {
    const result = { myField: { productId: '999' } };
    const productFields: ProductFieldsResult = new Map([['myField', '999']]);
    const products = new Map<string, any>();
    const productService = createMockProductService(products);

    const applied = await applyProductValues(result, productFields, productService);

    expect(applied.myField).toEqual({ productId: '999' });
  });

  it('handles nested paths via lodash set', async () => {
    const result = { nested: { deep: { product: {} } } };
    const productFields: ProductFieldsResult = new Map([['nested.deep.product', '5']]);
    const products = new Map([['5', { id: '5', title: 'Deep' }]]);
    const productService = createMockProductService(products);

    const applied = await applyProductValues(result, productFields, productService);

    expect((applied as any).nested.deep.product).toEqual({
      id: '5',
      title: 'Deep',
      productId: '5',
    });
  });
});
