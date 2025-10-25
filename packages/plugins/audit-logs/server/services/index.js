'use strict';

const auditLogs = require('./audit-logs');
const lifecycle = require('./lifecycle');

module.exports = {
  'audit-logs': auditLogs,
  lifecycle,
};