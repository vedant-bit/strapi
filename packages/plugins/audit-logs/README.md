# Strapi Audit Logs Plugin

Automated audit logging for all content changes performed through Strapi's Content API.

## Overview

This plugin provides comprehensive audit logging functionality for Strapi applications, automatically capturing and storing detailed information about all content operations (create, update, delete) performed through the Content API.

## Features

- **Automatic Logging**: Captures all content changes without manual intervention
- **Comprehensive Metadata**: Records user, timestamps, content type, and change details
- **Diff Tracking**: Shows exactly what fields changed during updates
- **REST API**: Provides endpoints for retrieving and filtering audit logs
- **Role-Based Access**: Configurable permissions for audit log access
- **Data Retention**: Automatic cleanup of old logs based on retention policy
- **Performance Optimized**: Non-blocking logging that doesn't impact main operations

## Architecture

### Core Components

1. **Content Type**: `audit-log` - Stores audit trail data
2. **Lifecycle Service**: Hooks into Strapi's database lifecycle events
3. **Audit Service**: Handles log creation, retrieval, and management
4. **REST Controller**: Provides API endpoints for audit log access
5. **Permission System**: Role-based access control

### Database Schema

The audit logs are stored in the `strapi_audit_logs` table with the following structure:

```javascript
{
  contentType: 'string',      // Content type UID (e.g., 'api::article.article')
  recordId: 'string',         // ID of the affected record
  action: 'enum',             // 'create', 'update', or 'delete'
  timestamp: 'datetime',      // When the operation occurred
  userId: 'integer',          // ID of the user who performed the action
  userEmail: 'string',        // Email of the user who performed the action
  changedFields: 'json',      // Fields that were changed (for updates)
  payload: 'json',            // Full payload for creates, or changed data
  previousData: 'json'        // Previous data before the change
}
```

### Integration Points

The plugin integrates with Strapi through:

1. **Database Lifecycle Hooks**: Subscribes to `afterCreate`, `beforeUpdate`, `afterUpdate`, `beforeDelete`, `afterDelete`, and `afterDeleteMany` events
2. **Permission System**: Registers custom permissions for audit log access
3. **Configuration System**: Uses Strapi's config system for plugin settings
4. **Cron Jobs**: Automatic cleanup of expired logs

## Installation

Since this is built into Strapi core, no installation is required. The plugin is available by default.

## Configuration

Add configuration to your `config/plugins.js` file:

```javascript
module.exports = {
  'audit-logs': {
    enabled: true,
    config: {
      // Enable/disable audit logging globally
      enabled: true,
      
      // Number of days to retain audit logs
      retentionDays: 90,
      
      // Content types to exclude from audit logging
      excludeContentTypes: [
        'api::sensitive-data.sensitive-data',
        // Add other content types to exclude
      ],
    },
  },
};
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | boolean | `true` | Enable/disable audit logging globally |
| `retentionDays` | number | `90` | Number of days to retain audit logs |
| `excludeContentTypes` | array | `[]` | Content type UIDs to exclude from logging |

## API Endpoints

All endpoints require authentication and appropriate permissions.

### GET /api/audit-logs

Retrieve audit logs with filtering and pagination.

**Query Parameters:**
- `contentType` (string): Filter by content type UID
- `userId` (number): Filter by user ID
- `action` (string): Filter by action type (`create`, `update`, `delete`)
- `dateRange[start]` (date): Start date for filtering
- `dateRange[end]` (date): End date for filtering
- `page` (number): Page number (default: 1)
- `pageSize` (number): Items per page (default: 25, max: 100)

**Example:**
```bash
GET /api/audit-logs?contentType=api::article.article&action=update&page=1&pageSize=10
```

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "contentType": "api::article.article",
      "recordId": "123",
      "action": "update",
      "timestamp": "2023-12-01T10:30:00.000Z",
      "userId": 1,
      "userEmail": "admin@example.com",
      "changedFields": {
        "title": {
          "from": "Old Title",
          "to": "New Title"
        }
      },
      "payload": {
        "title": "New Title"
      },
      "previousData": {
        "title": "Old Title",
        "content": "Article content..."
      }
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "total": 50,
      "pageCount": 5
    }
  }
}
```

### GET /api/audit-logs/:id

Retrieve a specific audit log entry.

**Response:**
```json
{
  "data": {
    "id": 1,
    "contentType": "api::article.article",
    "recordId": "123",
    "action": "update",
    "timestamp": "2023-12-01T10:30:00.000Z",
    "userId": 1,
    "userEmail": "admin@example.com",
    "changedFields": {...},
    "payload": {...},
    "previousData": {...}
  }
}
```

### GET /api/audit-logs/stats

Get audit log statistics.

**Query Parameters:**
- `dateRange[start]` (date): Start date for statistics
- `dateRange[end]` (date): End date for statistics

**Response:**
```json
{
  "data": {
    "totalLogs": 1250,
    "actionBreakdown": [
      { "action": "update", "count": 750 },
      { "action": "create", "count": 300 },
      { "action": "delete", "count": 200 }
    ],
    "topContentTypes": [
      { "contentType": "api::article.article", "count": 500 },
      { "contentType": "api::product.product", "count": 300 }
    ]
  }
}
```

## Permissions

The plugin defines the following permissions:

- `plugin::audit-logs.read` - Read audit logs and statistics

### Assigning Permissions

1. Go to Settings → Administration Panel → Roles
2. Select the role you want to grant permissions to
3. Find "Audit Logs" in the permissions list
4. Check the appropriate permissions

## Data Retention

Audit logs are automatically cleaned up based on the `retentionDays` configuration. A cron job runs daily at 2 AM to remove expired logs.

## Security Considerations

- **Sensitive Data**: The plugin automatically excludes sensitive fields like passwords and tokens
- **Access Control**: All endpoints require authentication and specific permissions
- **Data Sanitization**: All logged data is sanitized before storage
- **Non-Blocking**: Audit logging failures don't affect main operations

## Performance

- **Async Operations**: Audit logging is performed asynchronously to avoid blocking main operations
- **Efficient Queries**: Database queries are optimized with proper indexing
- **Configurable Exclusions**: Exclude high-volume or sensitive content types
- **Batch Processing**: Bulk operations are logged efficiently

## Troubleshooting

### Common Issues

1. **Audit logs not appearing**: Check if the plugin is enabled in configuration
2. **Permission errors**: Ensure the user has `plugin::audit-logs.read` permission
3. **Performance issues**: Consider excluding high-volume content types

### Debug Logging

Enable debug logging to troubleshoot issues:

```javascript
// config/logger.js
module.exports = {
  level: 'debug',
  // ... other config
};
```

## Development

### Testing

The plugin includes comprehensive tests for all components:

```bash
npm run test:unit
```

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

See LICENSE file in the root of the Strapi repository.