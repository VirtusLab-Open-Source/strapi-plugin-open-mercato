import adminRoutes from './admin.routes';
import contentManager from './content.manager.routes';

export default {
  admin: {
    type: 'admin',
    routes: [...contentManager, ...adminRoutes],
  },
};
