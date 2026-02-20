import contentManagerController from './content.manager.controller';
import adminController from './admin.controller';

const controllers = {
  contentManager: contentManagerController,
  admin: adminController,
};

export type Controllers = {
  [key in keyof typeof controllers]: ReturnType<(typeof controllers)[key]>;
};
export default controllers;
