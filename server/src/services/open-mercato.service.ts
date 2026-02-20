import { StrapiContext } from '../@types';
import { getRestClient } from './clients/rest.client';

const openMercatoService = ({ strapi }: StrapiContext) => {
  const restClient = getRestClient({ strapi });
  return {
    getRestClient() {
      return restClient;
    },
  };
};

export default openMercatoService;
