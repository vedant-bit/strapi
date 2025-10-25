import type { Plugin } from '@strapi/types';
import history from './history';
import auditLogs from './audit-logs';

const destroy: Plugin.LoadedPlugin['destroy'] = async ({ strapi }) => {
  await history.destroy?.({ strapi });
  await auditLogs.destroy?.(strapi);
};

export default destroy;
