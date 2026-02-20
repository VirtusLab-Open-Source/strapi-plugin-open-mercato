import { Core } from '@strapi/strapi';
import { FullPluginConfig } from '../config/schema';

export const getENVConfig = (strapi: Core.Strapi): FullPluginConfig =>
  strapi.config.get('plugin::open-mercato');
