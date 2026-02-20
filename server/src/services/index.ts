import products from './products.service';
import cache from './cache.service';
import openMercato from './open-mercato.service';
import admin from './admin.service';

const services = {
  products,
  cache,
  'open-mercato': openMercato,
  admin,
};
export type Services = {
  [key in keyof typeof services]: ReturnType<(typeof services)[key]>;
};
export default services;
