import adminController from '../admin.controller';
import type { StrapiContext } from '../../@types';
import type { RequestContext } from '../../@types/koa';
import * as utils from '../../utils';

jest.mock('../../utils', () => ({
  ...jest.requireActual('../../utils'),
  __esModule: true,
}));

const createMockAdminService = (overrides: Record<string, any> = {}) => ({
  getConfig: jest.fn().mockResolvedValue(null),
  isConfigured: jest.fn().mockReturnValue(false),
  updateConfig: jest.fn().mockResolvedValue({}),
  ...overrides,
});

const getMockStrapi = () => ({}) as unknown as StrapiContext['strapi'];

const getMockCtx = (overrides: Record<string, any> = {}) =>
  ({
    body: undefined,
    request: { body: {} },
    badRequest: jest.fn(),
    ...overrides,
  }) as unknown as RequestContext;

describe('admin.controller', () => {
  beforeEach(jest.restoreAllMocks);

  describe('getConfig', () => {
    it('returns configured: false when plugin is not configured', async () => {
      const adminService = createMockAdminService();
      jest.spyOn(utils, 'getService').mockReturnValue(adminService as any);
      const ctx = getMockCtx();

      const controller = adminController({ strapi: getMockStrapi() });
      await controller.getConfig(ctx);

      expect(ctx.body).toEqual({ apiUrl: '', accessToken: '', configured: false });
    });

    it('returns masked config when plugin is configured', async () => {
      const adminService = createMockAdminService({
        getConfig: jest.fn().mockResolvedValue({
          apiUrl: 'https://api.openmercato.com',
          accessToken: 'secret-token-value',
        }),
        isConfigured: jest.fn().mockReturnValue(true),
      });
      jest.spyOn(utils, 'getService').mockReturnValue(adminService as any);
      const ctx = getMockCtx();

      const controller = adminController({ strapi: getMockStrapi() });
      await controller.getConfig(ctx);

      expect(ctx.body).toEqual({
        apiUrl: 'https://api.openmercato.com',
        accessToken: 'sec*****e',
        configured: true,
      });
    });
  });

  describe('updateConfig', () => {
    it('saves valid config and returns it', async () => {
      const validBody = {
        apiUrl: 'https://api.openmercato.com',
        accessToken: 'my-token',
      };
      const adminService = createMockAdminService({
        updateConfig: jest.fn().mockResolvedValue(validBody),
      });
      jest.spyOn(utils, 'getService').mockReturnValue(adminService as any);
      const ctx = getMockCtx({ request: { body: validBody } });

      const controller = adminController({ strapi: getMockStrapi() });
      await controller.updateConfig(ctx);

      expect(adminService.updateConfig).toHaveBeenCalledWith(validBody);
      expect(ctx.body).toEqual(validBody);
    });

    it('returns badRequest for invalid config (missing apiUrl)', async () => {
      const adminService = createMockAdminService();
      jest.spyOn(utils, 'getService').mockReturnValue(adminService as any);
      const badRequest = jest.fn();
      const ctx = getMockCtx({
        request: { body: { accessToken: 'tok' } },
        badRequest,
      });

      const controller = adminController({ strapi: getMockStrapi() });
      await controller.updateConfig(ctx);

      expect(badRequest).toHaveBeenCalledWith(
        expect.stringContaining('apiUrl'),
        expect.objectContaining({ issues: expect.anything() })
      );
      expect(adminService.updateConfig).not.toHaveBeenCalled();
    });

    it('returns badRequest for invalid apiUrl (not a URL)', async () => {
      const adminService = createMockAdminService();
      jest.spyOn(utils, 'getService').mockReturnValue(adminService as any);
      const badRequest = jest.fn();
      const ctx = getMockCtx({
        request: { body: { apiUrl: 'not-a-url', accessToken: 'tok' } },
        badRequest,
      });

      const controller = adminController({ strapi: getMockStrapi() });
      await controller.updateConfig(ctx);

      expect(badRequest).toHaveBeenCalled();
    });

    it('returns badRequest for empty accessToken', async () => {
      const adminService = createMockAdminService();
      jest.spyOn(utils, 'getService').mockReturnValue(adminService as any);
      const badRequest = jest.fn();
      const ctx = getMockCtx({
        request: { body: { apiUrl: 'https://api.test.com', accessToken: '' } },
        badRequest,
      });

      const controller = adminController({ strapi: getMockStrapi() });
      await controller.updateConfig(ctx);

      expect(badRequest).toHaveBeenCalled();
    });
  });
});
