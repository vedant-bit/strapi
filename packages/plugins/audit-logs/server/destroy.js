'use strict';

module.exports = async ({ strapi }) => {
  const lifecycleService = strapi.plugin('audit-logs').service('lifecycle');
  if (lifecycleService) {
    await lifecycleService.destroy();
  }
  
  strapi.log.info('Audit logs plugin destroyed');
};