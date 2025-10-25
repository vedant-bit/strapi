'use strict';

module.exports = async ({ strapi }) => {
  // Register permissions
  const actions = [
    {
      section: 'plugins',
      displayName: 'Read Audit Logs',
      uid: 'read',
      pluginName: 'audit-logs',
    },
  ];

  await strapi.admin.services.permission.actionProvider.registerMany(actions);
  
  strapi.log.info('Audit logs plugin registered');
};