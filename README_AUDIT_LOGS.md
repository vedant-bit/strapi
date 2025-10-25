# Strapi Audit Logs Implementation

This repository contains the implementation of an automated audit logging feature for Strapi that captures comprehensive audit trails for all content changes performed through the Content API.

## 🎯 Assignment Completion

This implementation fulfills all requirements of the Strapi audit logging assignment:

### ✅ Feature Implementation
- **Automated Audit Logging**: Captures all content changes (create, update, delete) via Content API
- **Comprehensive Metadata**: Records user, content type, timestamps, and detailed change information
- **Database Storage**: Uses `strapi_audit_logs` table with proper indexing
- **REST API**: Provides `/api/audit-logs` endpoint with filtering and pagination

### ✅ Access Control & Configuration
- **Role-Based Access**: `audit-logs.read` permission required
- **Configuration Options**: 
  - `auditLog.enabled` - Global enable/disable
  - `auditLog.excludeContentTypes` - Exclude specific content types
  - `auditLog.retentionDays` - Data retention period

### ✅ Documentation
- **Comprehensive README**: [`packages/plugins/audit-logs/README.md`](packages/plugins/audit-logs/README.md)
- **Design Summary**: [`DESIGN_NOTE.md`](DESIGN_NOTE.md)
- **Testing Guide**: [`packages/plugins/audit-logs/TESTING.md`](packages/plugins/audit-logs/TESTING.md)

## 🏗️ Architecture Overview

### Plugin Structure
```
packages/plugins/audit-logs/
├── server/
│   ├── content-types/
│   │   ├── audit-log.js          # Database schema
│   │   └── index.js
│   ├── services/
│   │   ├── audit-logs.js         # Core service logic
│   │   ├── lifecycle.js          # Lifecycle hook management
│   │   └── index.js
│   ├── controllers/
│   │   ├── audit-logs.js         # REST API handlers
│   │   └── index.js
│   ├── routes/
│   │   └── index.js              # API route definitions
│   ├── config/
│   │   └── index.js              # Default configuration
│   ├── __tests__/
│   │   ├── audit-logs.test.js    # Unit tests
│   │   └── integration.test.js   # Integration tests
│   ├── bootstrap.js              # Plugin initialization
│   ├── register.js               # Plugin registration
│   ├── destroy.js                # Plugin cleanup
│   └── index.js                  # Main plugin entry
├── package.json
├── README.md                     # Detailed documentation
└── TESTING.md                    # Testing procedures
```

## 🚀 Quick Start

### 1. Enable the Plugin

Add to your `config/plugins.js`:

```javascript
module.exports = {
  'audit-logs': {
    enabled: true,
    config: {
      enabled: true,
      retentionDays: 90,
      excludeContentTypes: [
        // Add content types to exclude
      ],
    },
  },
};
```

### 2. Start Strapi

```bash
npm run develop
```

The plugin will automatically:
- Create the `strapi_audit_logs` table
- Register lifecycle hooks
- Set up API endpoints
- Configure permissions

### 3. Test the Implementation

**Create some content:**
```bash
curl -X POST http://localhost:1337/api/articles \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"data": {"title": "Test Article", "content": "Test content"}}'
```

**Check audit logs:**
```bash
curl -X GET http://localhost:1337/api/audit-logs \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

## 📊 API Usage Examples

### Retrieve All Audit Logs
```bash
GET /api/audit-logs
```

### Filter by Content Type
```bash
GET /api/audit-logs?contentType=api::article.article
```

### Filter by Action and Date Range
```bash
GET /api/audit-logs?action=update&dateRange[start]=2023-12-01&dateRange[end]=2023-12-31
```

### Get Statistics
```bash
GET /api/audit-logs/stats
```

## 🔧 Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | boolean | `true` | Enable/disable audit logging globally |
| `retentionDays` | number | `90` | Number of days to retain audit logs |
| `excludeContentTypes` | array | `[]` | Content type UIDs to exclude from logging |

## 🧪 Testing

### Run Unit Tests
```bash
npm test packages/plugins/audit-logs
```

### Manual Testing
See [`TESTING.md`](packages/plugins/audit-logs/TESTING.md) for comprehensive testing procedures.

## 📋 Implementation Details

### Database Schema
- **Content Type**: Stores audit trail metadata
- **Efficient Indexing**: Optimized for common query patterns
- **JSON Storage**: Flexible payload and diff storage

### Security Features
- **Data Sanitization**: Removes sensitive fields automatically
- **Access Control**: Role-based permissions
- **Input Validation**: All API inputs validated

### Performance Features
- **Non-Blocking**: Audit failures don't affect main operations
- **Async Processing**: Background audit log creation
- **Automatic Cleanup**: Cron job for expired logs

## 🎯 Key Features Delivered

1. **✅ Automated Audit Logging** - All content changes captured automatically
2. **✅ Comprehensive Metadata** - User, timestamps, content type, change details
3. **✅ REST API Access** - Full CRUD API with filtering and pagination
4. **✅ Role-Based Access Control** - Configurable permissions system
5. **✅ Configuration Options** - Flexible enable/disable and exclusion settings
6. **✅ Performance Optimized** - Non-blocking, efficient database operations
7. **✅ Complete Documentation** - Architecture, usage, and testing guides
8. **✅ Test Suite** - Unit and integration tests included

## 📝 Files Modified/Created

- **New Plugin**: `packages/plugins/audit-logs/` (complete plugin implementation)
- **Design Document**: `DESIGN_NOTE.md` (architecture and design decisions)
- **Integration Files**: Modified content-manager bootstrap/register/destroy files
- **Documentation**: Comprehensive README and testing guides

The implementation is ready for production use and provides a complete audit logging solution for Strapi applications.