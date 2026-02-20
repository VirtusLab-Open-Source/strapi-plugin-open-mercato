import openMercatoService from '../open-mercato.service';
import type { StrapiContext } from '../../@types';
import { getRestClient } from '../clients/rest.client';

jest.mock('../clients/rest.client', () => ({
  getRestClient: jest.fn(),
}));

const getMockStrapi = () => ({}) as unknown as StrapiContext['strapi'];

describe('openMercatoService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns an object with getRestClient method', () => {
    // Arrange
    const strapi = getMockStrapi();
    const mockRestClient = { rest: true };
    (getRestClient as jest.Mock).mockReturnValue(mockRestClient);

    // Act
    const service = openMercatoService({ strapi });

    // Assert
    expect(typeof service.getRestClient).toBe('function');
  });

  it('getRestClient returns the rest client instance', () => {
    // Arrange
    const strapi = getMockStrapi();
    const mockRestClient = { rest: true };
    (getRestClient as jest.Mock).mockReturnValue(mockRestClient);

    // Act
    const service = openMercatoService({ strapi });
    const client = service.getRestClient();

    // Assert
    expect(getRestClient).toHaveBeenCalledWith({ strapi });
    expect(client).toBe(mockRestClient);
  });
});
