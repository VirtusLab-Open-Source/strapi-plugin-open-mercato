import { StrapiRoute } from './types';

const routes: StrapiRoute<'contentManager'>[] = [
  {
    method: 'GET',
    path: '/content-manager/configured',
    handler: 'contentManager.isConfigured',
  },
  {
    method: 'GET',
    path: '/content-manager/products',
    handler: 'contentManager.getProducts',
  },
];

export default routes;
