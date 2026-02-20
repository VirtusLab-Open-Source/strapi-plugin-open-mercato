import { getProductFields } from '../getProductFields';
import type { UID } from '@strapi/strapi';
import type { FieldType } from '../../../@types/document.service';

const uid = (name: string) => name as UID.ContentType;
const emptyMap = () => new Map<UID.ContentType, Array<FieldType>>();

describe('getProductFields', () => {
  describe('edge cases', () => {
    it('returns empty map for null fetchedData', () => {
      const result = getProductFields({
        contentType: [],
        fetchedData: null as any,
        contentTypes: emptyMap(),
        components: emptyMap(),
      });
      expect(result.size).toBe(0);
    });

    it('returns empty map for undefined fetchedData', () => {
      const result = getProductFields({
        contentType: [],
        fetchedData: undefined as any,
        contentTypes: emptyMap(),
        components: emptyMap(),
      });
      expect(result.size).toBe(0);
    });

    it('returns empty map for non-object fetchedData', () => {
      const result = getProductFields({
        contentType: [],
        fetchedData: 'string' as any,
        contentTypes: emptyMap(),
        components: emptyMap(),
      });
      expect(result.size).toBe(0);
    });
  });

  describe('single result (object)', () => {
    it('extracts product from raw field with product key', () => {
      const contentType: FieldType[] = [{ type: 'raw', field: 'openMercatoProduct' }];

      const result = getProductFields({
        contentType,
        fetchedData: { openMercatoProduct: { product: '42' } } as any,
        contentTypes: emptyMap(),
        components: emptyMap(),
      });

      expect(result.get('openMercatoProduct')).toBe('42');
    });

    it('extracts product from raw field with productId key', () => {
      const contentType: FieldType[] = [{ type: 'raw', field: 'myProduct' }];

      const result = getProductFields({
        contentType,
        fetchedData: { myProduct: { productId: '99' } } as any,
        contentTypes: emptyMap(),
        components: emptyMap(),
      });

      expect(result.get('myProduct')).toBe('99');
    });

    it('converts numeric product id to string', () => {
      const contentType: FieldType[] = [{ type: 'raw', field: 'prod' }];

      const result = getProductFields({
        contentType,
        fetchedData: { prod: { product: 7 } } as any,
        contentTypes: emptyMap(),
        components: emptyMap(),
      });

      expect(result.get('prod')).toBe('7');
    });

    it('skips raw field with no product or productId', () => {
      const contentType: FieldType[] = [{ type: 'raw', field: 'prod' }];

      const result = getProductFields({
        contentType,
        fetchedData: { prod: { other: 'data' } } as any,
        contentTypes: emptyMap(),
        components: emptyMap(),
      });

      expect(result.size).toBe(0);
    });

    it('skips missing field data', () => {
      const contentType: FieldType[] = [{ type: 'raw', field: 'missing' }];

      const result = getProductFields({
        contentType,
        fetchedData: { other: 'data' } as any,
        contentTypes: emptyMap(),
        components: emptyMap(),
      });

      expect(result.size).toBe(0);
    });

    it('processes component fields', () => {
      const componentUid = uid('shared.product-card');
      const contentType: FieldType[] = [
        { type: 'component', field: 'card', component: componentUid as any, repeatable: false },
      ];
      const components = new Map<UID.ContentType, Array<FieldType>>([
        [componentUid, [{ type: 'raw', field: 'product' }]],
      ]);

      const result = getProductFields({
        contentType,
        fetchedData: { card: { product: { product: '10' } } } as any,
        contentTypes: emptyMap(),
        components,
      });

      expect(result.get('card.product')).toBe('10');
    });

    it('processes repeatable component fields', () => {
      const componentUid = uid('shared.product-card');
      const contentType: FieldType[] = [
        { type: 'component', field: 'cards', component: componentUid as any, repeatable: true },
      ];
      const components = new Map<UID.ContentType, Array<FieldType>>([
        [componentUid, [{ type: 'raw', field: 'item' }]],
      ]);

      const result = getProductFields({
        contentType,
        fetchedData: {
          cards: [
            { item: { product: '1' } },
            { item: { product: '2' } },
          ],
        } as any,
        contentTypes: emptyMap(),
        components,
      });

      expect(result.get('cards.0.item')).toBe('1');
      expect(result.get('cards.1.item')).toBe('2');
    });

    it('processes relation fields (single)', () => {
      const targetUid = uid('api::related.related');
      const contentType: FieldType[] = [
        { type: 'relation', field: 'related', target: targetUid },
      ];
      const contentTypes = new Map<UID.ContentType, Array<FieldType>>([
        [targetUid, [{ type: 'raw', field: 'product' }]],
      ]);

      const result = getProductFields({
        contentType,
        fetchedData: { related: { product: { product: '20' } } } as any,
        contentTypes,
        components: emptyMap(),
      });

      expect(result.get('related.product')).toBe('20');
    });

    it('processes relation fields (collection)', () => {
      const targetUid = uid('api::item.item');
      const contentType: FieldType[] = [
        { type: 'relation', field: 'items', target: targetUid },
      ];
      const contentTypes = new Map<UID.ContentType, Array<FieldType>>([
        [targetUid, [{ type: 'raw', field: 'prod' }]],
      ]);

      const result = getProductFields({
        contentType,
        fetchedData: {
          items: [
            { prod: { product: 'a' } },
            { prod: { product: 'b' } },
          ],
        } as any,
        contentTypes,
        components: emptyMap(),
      });

      expect(result.get('items.0.prod')).toBe('a');
      expect(result.get('items.1.prod')).toBe('b');
    });

    it('processes dynamic zone fields', () => {
      const dzComponentUid = uid('shared.product-block');
      const contentType: FieldType[] = [
        { type: 'dynamiczone', field: 'content', components: [dzComponentUid as any] },
      ];
      const components = new Map<UID.ContentType, Array<FieldType>>([
        [dzComponentUid, [{ type: 'raw', field: 'product' }]],
      ]);

      const result = getProductFields({
        contentType,
        fetchedData: {
          content: [
            { __component: 'shared.product-block', product: { product: '50' } },
          ],
        } as any,
        contentTypes: emptyMap(),
        components,
      });

      expect(result.get('content.0.product')).toBe('50');
    });

    it('skips dynamic zone items without matching component', () => {
      const contentType: FieldType[] = [
        { type: 'dynamiczone', field: 'content', components: ['shared.unknown' as any] },
      ];

      const result = getProductFields({
        contentType,
        fetchedData: {
          content: [{ __component: 'shared.unknown', product: { product: '1' } }],
        } as any,
        contentTypes: emptyMap(),
        components: emptyMap(),
      });

      expect(result.size).toBe(0);
    });

    it('skips dynamic zone items without __component', () => {
      const contentType: FieldType[] = [
        { type: 'dynamiczone', field: 'content', components: [] },
      ];

      const result = getProductFields({
        contentType,
        fetchedData: { content: [{ product: { product: '1' } }] } as any,
        contentTypes: emptyMap(),
        components: emptyMap(),
      });

      expect(result.size).toBe(0);
    });

    it('handles component field with no data (null)', () => {
      const componentUid = uid('shared.card');
      const contentType: FieldType[] = [
        { type: 'component', field: 'card', component: componentUid as any, repeatable: false },
      ];
      const components = new Map<UID.ContentType, Array<FieldType>>([
        [componentUid, [{ type: 'raw', field: 'product' }]],
      ]);

      const result = getProductFields({
        contentType,
        fetchedData: { card: null } as any,
        contentTypes: emptyMap(),
        components,
      });

      expect(result.size).toBe(0);
    });

    it('handles component not found in components map', () => {
      const contentType: FieldType[] = [
        { type: 'component', field: 'card', component: 'shared.missing' as any, repeatable: false },
      ];

      const result = getProductFields({
        contentType,
        fetchedData: { card: { product: { product: '1' } } } as any,
        contentTypes: emptyMap(),
        components: emptyMap(),
      });

      expect(result.size).toBe(0);
    });

    it('handles relation target not found in contentTypes map', () => {
      const contentType: FieldType[] = [
        { type: 'relation', field: 'rel', target: 'api::missing.missing' as UID.ContentType },
      ];

      const result = getProductFields({
        contentType,
        fetchedData: { rel: { product: { product: '1' } } } as any,
        contentTypes: emptyMap(),
        components: emptyMap(),
      });

      expect(result.size).toBe(0);
    });

    it('handles relation field with null data', () => {
      const targetUid = uid('api::item.item');
      const contentType: FieldType[] = [
        { type: 'relation', field: 'items', target: targetUid },
      ];
      const contentTypes = new Map<UID.ContentType, Array<FieldType>>([
        [targetUid, [{ type: 'raw', field: 'prod' }]],
      ]);

      const result = getProductFields({
        contentType,
        fetchedData: { items: null } as any,
        contentTypes,
        components: emptyMap(),
      });

      expect(result.size).toBe(0);
    });

    it('handles dynamiczone field that is not an array', () => {
      const contentType: FieldType[] = [
        { type: 'dynamiczone', field: 'content', components: [] },
      ];

      const result = getProductFields({
        contentType,
        fetchedData: { content: 'not-an-array' } as any,
        contentTypes: emptyMap(),
        components: emptyMap(),
      });

      expect(result.size).toBe(0);
    });
  });

  describe('array results', () => {
    it('processes array of results with raw fields', () => {
      const contentType: FieldType[] = [{ type: 'raw', field: 'product' }];

      const result = getProductFields({
        contentType,
        fetchedData: [
          { product: { product: '1' } },
          { product: { product: '2' } },
        ] as any,
        contentTypes: emptyMap(),
        components: emptyMap(),
      });

      expect(result.get('0.product')).toBe('1');
      expect(result.get('1.product')).toBe('2');
    });

    it('processes array results with components', () => {
      const componentUid = uid('shared.card');
      const contentType: FieldType[] = [
        { type: 'component', field: 'card', component: componentUid as any, repeatable: false },
      ];
      const components = new Map<UID.ContentType, Array<FieldType>>([
        [componentUid, [{ type: 'raw', field: 'item' }]],
      ]);

      const result = getProductFields({
        contentType,
        fetchedData: [{ card: { item: { product: '10' } } }] as any,
        contentTypes: emptyMap(),
        components,
      });

      expect(result.get('0.card.item')).toBe('10');
    });

    it('processes array results with relations', () => {
      const targetUid = uid('api::related.related');
      const contentType: FieldType[] = [
        { type: 'relation', field: 'rel', target: targetUid },
      ];
      const contentTypes = new Map<UID.ContentType, Array<FieldType>>([
        [targetUid, [{ type: 'raw', field: 'product' }]],
      ]);

      const result = getProductFields({
        contentType,
        fetchedData: [{ rel: { product: { productId: '30' } } }] as any,
        contentTypes,
        components: emptyMap(),
      });

      expect(result.get('0.rel.product')).toBe('30');
    });

    it('processes array results with dynamiczone', () => {
      const dzUid = uid('shared.dz-component');
      const contentType: FieldType[] = [
        { type: 'dynamiczone', field: 'content', components: [dzUid as any] },
      ];
      const components = new Map<UID.ContentType, Array<FieldType>>([
        [dzUid, [{ type: 'raw', field: 'product' }]],
      ]);

      const result = getProductFields({
        contentType,
        fetchedData: [
          { content: [{ __component: 'shared.dz-component', product: { product: '77' } }] },
        ] as any,
        contentTypes: emptyMap(),
        components,
      });

      expect(result.get('0.content.0.product')).toBe('77');
    });

    it('skips array entries with missing field data', () => {
      const contentType: FieldType[] = [{ type: 'raw', field: 'product' }];

      const result = getProductFields({
        contentType,
        fetchedData: [{ other: 'data' }, { product: { product: '5' } }] as any,
        contentTypes: emptyMap(),
        components: emptyMap(),
      });

      expect(result.size).toBe(1);
      expect(result.get('1.product')).toBe('5');
    });

    it('handles dynamiczone non-array in array results', () => {
      const contentType: FieldType[] = [
        { type: 'dynamiczone', field: 'content', components: [] },
      ];

      const result = getProductFields({
        contentType,
        fetchedData: [{ content: 'not-an-array' }] as any,
        contentTypes: emptyMap(),
        components: emptyMap(),
      });

      expect(result.size).toBe(0);
    });
  });
});
