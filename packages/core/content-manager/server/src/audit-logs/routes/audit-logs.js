'use strict';

/**
 * Audit Logs Routes
 * Defines REST API endpoints for audit log access
 */

module.exports = {
  type: 'admin',
  routes: [
    {
      method: 'GET',
      path: '/audit-logs',
      handler: 'audit-logs.find',
      config: {
        policies: ['admin::isAuthenticatedAdmin', 'admin::hasPermissions'],
        middlewares: ['admin::rateLimit'],
        auth: {
          scope: ['audit-logs.read'],
        },
      },
    },
    {
      method: 'GET',
      path: '/audit-logs/stats',
      handler: 'audit-logs.getStats',
      config: {
        policies: ['admin::isAuthenticatedAdmin', 'admin::hasPermissions'],
        middlewares: ['admin::rateLimit'],
        auth: {
          scope: ['audit-logs.read'],
        },
      },
    },
    {
      method: 'GET',
      path: '/audit-logs/export',
      handler: 'audit-logs.export',
      config: {
        policies: ['admin::isAuthenticatedAdmin', 'admin::hasPermissions'],
        middlewares: ['admin::rateLimit'],
        auth: {
          scope: ['audit-logs.export'],
        },
      },
    },
    {
      method: 'GET',
      path: '/audit-logs/:id',
      handler: 'audit-logs.findOne',
      config: {
        policies: ['admin::isAuthenticatedAdmin', 'admin::hasPermissions'],
        middlewares: ['admin::rateLimit'],
        auth: {
          scope: ['audit-logs.read'],
        },
      },
    },
  ],
};