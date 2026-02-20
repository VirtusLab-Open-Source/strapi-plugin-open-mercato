import { getModelsFieldsMap } from '../getModelsFieldsMap';
import { OPEN_MERCATO_CUSTOM_FIELDS } from '../../../const';
import type { UID } from '@strapi/strapi';

const mockContentTypes = (entries: Record<string, { attributes: Record<string, any> }>) =>
  entries as unknown as Parameters<typeof getModelsFieldsMap>[0];

describe('getModelsFieldsMap', () => {
  it('returns empty map when no content types have custom fields', () => {
    const data = mockContentTypes({
      'api::article.article': {
        attributes: {
          title: { type: 'string' },
          body: { type: 'richtext' },
        },
      },
    });

    const result = getModelsFieldsMap(data);
    expect(result.size).toBe(0);
  });

  it('detects raw custom fields (Open Mercato product)', () => {
    const data = mockContentTypes({
      'api::article.article': {
        attributes: {
          title: { type: 'string' },
          product: { type: 'json', customField: OPEN_MERCATO_CUSTOM_FIELDS },
        },
      },
    });

    const result = getModelsFieldsMap(data);
    expect(result.size).toBe(1);

    const fields = result.get('api::article.article' as UID.ContentType);
    expect(fields).toEqual([{ field: 'product', type: 'raw' }]);
  });

  it('detects component fields', () => {
    const data = mockContentTypes({
      'api::page.page': {
        attributes: {
          hero: {
            type: 'component',
            component: 'shared.hero',
            repeatable: false,
          },
        },
      },
    });

    const result = getModelsFieldsMap(data);
    expect(result.size).toBe(1);

    const fields = result.get('api::page.page' as UID.ContentType);
    expect(fields).toEqual([
      { type: 'component', field: 'hero', component: 'shared.hero', repeatable: false },
    ]);
  });

  it('detects repeatable component fields', () => {
    const data = mockContentTypes({
      'api::page.page': {
        attributes: {
          blocks: {
            type: 'component',
            component: 'shared.block',
            repeatable: true,
          },
        },
      },
    });

    const result = getModelsFieldsMap(data);
    const fields = result.get('api::page.page' as UID.ContentType);
    expect(fields).toEqual([
      { type: 'component', field: 'blocks', component: 'shared.block', repeatable: true },
    ]);
  });

  it('detects dynamiczone fields', () => {
    const data = mockContentTypes({
      'api::page.page': {
        attributes: {
          content: {
            type: 'dynamiczone',
            components: ['shared.hero', 'shared.cta'],
          },
        },
      },
    });

    const result = getModelsFieldsMap(data);
    const fields = result.get('api::page.page' as UID.ContentType);
    expect(fields).toEqual([
      { type: 'dynamiczone', field: 'content', components: ['shared.hero', 'shared.cta'] },
    ]);
  });

  it('detects relation fields (non-blacklisted)', () => {
    const data = mockContentTypes({
      'api::article.article': {
        attributes: {
          author: {
            type: 'relation',
            target: 'api::author.author',
          },
        },
      },
    });

    const result = getModelsFieldsMap(data);
    const fields = result.get('api::article.article' as UID.ContentType);
    expect(fields).toEqual([
      { type: 'relation', field: 'author', target: 'api::author.author' },
    ]);
  });

  it('filters out blacklisted relations (admin::)', () => {
    const data = mockContentTypes({
      'api::article.article': {
        attributes: {
          createdBy: {
            type: 'relation',
            target: 'admin::user',
          },
        },
      },
    });

    const result = getModelsFieldsMap(data);
    expect(result.size).toBe(0);
  });

  it('filters out blacklisted relations (plugin::upload)', () => {
    const data = mockContentTypes({
      'api::article.article': {
        attributes: {
          image: {
            type: 'relation',
            target: 'plugin::upload.file',
          },
        },
      },
    });

    const result = getModelsFieldsMap(data);
    expect(result.size).toBe(0);
  });

  it('filters out blacklisted field names (localizations)', () => {
    const data = mockContentTypes({
      'api::article.article': {
        attributes: {
          localizations: {
            type: 'relation',
            target: 'api::article.article',
          },
        },
      },
    });

    const result = getModelsFieldsMap(data);
    expect(result.size).toBe(0);
  });

  it('handles content types with no attributes', () => {
    const data = mockContentTypes({
      'api::empty.empty': { attributes: {} },
    });

    const result = getModelsFieldsMap(data);
    expect(result.size).toBe(0);
  });

  it('skips content types with null/undefined attributes', () => {
    const data = mockContentTypes({
      'api::broken.broken': { attributes: null as any },
    });

    const result = getModelsFieldsMap(data);
    expect(result.size).toBe(0);
  });

  it('handles mixed field types in one content type', () => {
    const data = mockContentTypes({
      'api::page.page': {
        attributes: {
          title: { type: 'string' },
          product: { type: 'json', customField: OPEN_MERCATO_CUSTOM_FIELDS },
          hero: { type: 'component', component: 'shared.hero', repeatable: false },
          author: { type: 'relation', target: 'api::author.author' },
          content: { type: 'dynamiczone', components: ['shared.block'] },
        },
      },
    });

    const result = getModelsFieldsMap(data);
    const fields = result.get('api::page.page' as UID.ContentType);
    expect(fields).toHaveLength(4);
  });

  it('ignores custom fields from other plugins', () => {
    const data = mockContentTypes({
      'api::article.article': {
        attributes: {
          seo: { type: 'json', customField: 'plugin::seo.metadata' },
        },
      },
    });

    const result = getModelsFieldsMap(data);
    expect(result.size).toBe(0);
  });
});
