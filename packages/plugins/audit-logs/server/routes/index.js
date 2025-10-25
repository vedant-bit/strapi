'use strict';

module.exports = [
  {
    method: 'GET',
    path: '/audit-logs',
    handler: 'audit-logs.find',
    config: {
      policies: ['admin::isAuthenticatedAdmin'],
    },
  },
  {
    method: 'GET',
    path: '/audit-logs/stats',
    handler: 'audit-logs.getStats',
    config: {
      policies: ['admin::isAuthenticatedAdmin'],
    },
  },
  {
    method: 'GET',
    path: '/audit-logs/:id',
    handler: 'audit-logs.findOne',
    config: {
      policies: ['admin::isAuthenticatedAdmin'],
    },
  },
];