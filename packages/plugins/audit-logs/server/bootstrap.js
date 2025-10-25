'use strict';

module.exports = async ({ strapi }) => {
  const config = strapi.config.get('plugin.audit-logs', { enabled: true });
  
  if (!config.enabled) {
    strapi.log.info('Audit logging is disabled');
    return;
  }

  // Initialize lifecycle service
  const lifecycleService = strapi.plugin('audit-logs').service('lifecycle');
  await lifecycleService.bootstrap();
  
  strapi.log.info('Audit logs plugin bootstrapped');
};