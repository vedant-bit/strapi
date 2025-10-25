'use strict';

module.exports = {
  default: {
    enabled: true,
    retentionDays: 90,
    excludeContentTypes: [
      'strapi::core-store',
      'strapi::webhooks',
      'admin::permission',
      'admin::user',
      'admin::role',
      'admin::api-token',
      'plugin::upload.file',
      'plugin::upload.folder',
      'plugin::audit-logs.audit-log',
    ],
  },
  validator() {},
};