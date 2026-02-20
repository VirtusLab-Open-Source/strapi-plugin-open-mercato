import bootstrap from '../bootstrap';
import * as utils from '../utils';

jest.mock('../utils', () => ({
  getService: jest.fn(),
  getENVConfig: jest.fn(),
}));

jest.mock('../permissions', () => ({
  setupPermissions: jest.fn().mockResolvedValue(undefined),
}));

const { setupPermissions } = require('../permissions');

describe('bootstrap', () => {
  beforeEach(jest.clearAllMocks);

  it('seeds config from ENV when store is empty and ENV has credentials', async () => {
    const mockAdminService = {
      getConfig: jest.fn().mockResolvedValue(null),
      isConfigured: jest.fn().mockReturnValue(false),
      updateConfig: jest.fn().mockResolvedValue({}),
    };
    (utils.getService as jest.Mock).mockReturnValue(mockAdminService);
    (utils.getENVConfig as jest.Mock).mockReturnValue({
      apiUrl: 'https://env.api.com',
      accessToken: 'env-token',
      encryptionKey: 'x'.repeat(32),
    });

    await bootstrap({ strapi: {} as any });

    expect(mockAdminService.updateConfig).toHaveBeenCalledWith({
      apiUrl: 'https://env.api.com',
      accessToken: 'env-token',
    });
    expect(setupPermissions).toHaveBeenCalled();
  });

  it('does not seed config when store already has valid config', async () => {
    const mockAdminService = {
      getConfig: jest.fn().mockResolvedValue({
        apiUrl: 'https://stored.com',
        accessToken: 'stored-token',
      }),
      isConfigured: jest.fn().mockReturnValue(true),
      updateConfig: jest.fn(),
    };
    (utils.getService as jest.Mock).mockReturnValue(mockAdminService);

    await bootstrap({ strapi: {} as any });

    expect(mockAdminService.updateConfig).not.toHaveBeenCalled();
    expect(setupPermissions).toHaveBeenCalled();
  });

  it('does not seed config when ENV has no credentials', async () => {
    const mockAdminService = {
      getConfig: jest.fn().mockResolvedValue(null),
      isConfigured: jest.fn().mockReturnValue(false),
      updateConfig: jest.fn(),
    };
    (utils.getService as jest.Mock).mockReturnValue(mockAdminService);
    (utils.getENVConfig as jest.Mock).mockReturnValue({
      encryptionKey: 'x'.repeat(32),
    });

    await bootstrap({ strapi: {} as any });

    expect(mockAdminService.updateConfig).not.toHaveBeenCalled();
    expect(setupPermissions).toHaveBeenCalled();
  });

  it('always calls setupPermissions', async () => {
    const mockAdminService = {
      getConfig: jest.fn().mockResolvedValue(null),
      isConfigured: jest.fn().mockReturnValue(false),
      updateConfig: jest.fn(),
    };
    (utils.getService as jest.Mock).mockReturnValue(mockAdminService);
    (utils.getENVConfig as jest.Mock).mockReturnValue({});

    await bootstrap({ strapi: {} as any });

    expect(setupPermissions).toHaveBeenCalledWith({ strapi: expect.anything() });
  });
});
