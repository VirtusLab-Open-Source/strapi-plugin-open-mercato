import { pluginPermissions } from '../permissions';
import { StrapiRoute } from './types';

const routes: StrapiRoute<'admin'>[] = [
  {
    method: 'GET',
    path: '/settings',
    handler: 'admin.getConfig',
    config: {
      policies: [
        {
          name: 'admin::hasPermissions',
          config: {
            actions: [pluginPermissions.render('settings')],
          },
        },
      ],
    },
  },
  {
    method: 'PUT',
    path: '/settings',
    handler: 'admin.updateConfig',
    config: {
      policies: [
        {
          name: 'admin::hasPermissions',
          config: {
            actions: [pluginPermissions.render('settings')],
          },
        },
      ],
    },
  },
];

export default routes;
