# Testing Guide for Audit Logs Plugin

## Overview

This document provides comprehensive testing instructions for the Strapi Audit Logs plugin, including unit tests, integration tests, and manual testing procedures.

## Unit Tests

### Running Unit Tests

```bash
# Run all plugin tests
npm test packages/plugins/audit-logs

# Run with coverage
npm test packages/plugins/audit-logs -- --coverage

# Watch mode for development
npm test packages/plugins/audit-logs -- --watch
```

### Test Coverage

The unit tests cover:
- ✅ Audit log service methods
- ✅ Data sanitization
- ✅ Diff calculation
- ✅ Content type filtering
- ✅ User context extraction

## Integration Testing

### Manual Testing Steps

#### 1. Setup Test Environment

```bash
# Create a new Strapi app for testing
npx create-strapi-app@latest audit-test --quickstart

# Copy the audit-logs plugin to the test app
cp -r packages/plugins/audit-logs test-app/src/plugins/
```

#### 2. Enable the Plugin

Add to `config/plugins.js`:

```javascript
module.exports = {
  'audit-logs': {
    enabled: true,
    config: {
      enabled: true,
      retentionDays: 30,
      excludeContentTypes: [],
    },
  },
};
```

#### 3. Test Content Operations

**Create Operation Test:**
```bash
# Start Strapi
npm run develop

# Create content via API
curl -X POST http://localhost:1337/api/articles \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"data": {"title": "Test Article", "content": "Test content"}}'

# Verify audit log was created
curl -X GET http://localhost:1337/api/audit-logs \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Update Operation Test:**
```bash
# Update the article
curl -X PUT http://localhost:1337/api/articles/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"data": {"title": "Updated Article"}}'

# Check audit log shows the change
curl -X GET "http://localhost:1337/api/audit-logs?action=update" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Delete Operation Test:**
```bash
# Delete the article
curl -X DELETE http://localhost:1337/api/articles/1 \
  -H "Authorization: Bearer YOUR_TOKEN"

# Verify delete audit log
curl -X GET "http://localhost:1337/api/audit-logs?action=delete" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

#### 4. Test API Filtering

```bash
# Filter by content type
curl -X GET "http://localhost:1337/api/audit-logs?contentType=api::article.article" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Filter by date range
curl -X GET "http://localhost:1337/api/audit-logs?dateRange[start]=2023-12-01&dateRange[end]=2023-12-31" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Test pagination
curl -X GET "http://localhost:1337/api/audit-logs?page=1&pageSize=5" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

#### 5. Test Statistics Endpoint

```bash
# Get audit log statistics
curl -X GET http://localhost:1337/api/audit-logs/stats \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

#### 6. Test Permissions

```bash
# Test without proper permissions (should return 403)
curl -X GET http://localhost:1337/api/audit-logs \
  -H "Authorization: Bearer INVALID_TOKEN"

# Test with user lacking audit-logs.read permission
curl -X GET http://localhost:1337/api/audit-logs \
  -H "Authorization: Bearer LIMITED_USER_TOKEN"
```

## Expected Test Results

### 1. Create Operation
- Audit log entry created with `action: 'create'`
- `payload` contains the created data
- `previousData` is null
- `changedFields` is null

### 2. Update Operation
- Audit log entry created with `action: 'update'`
- `changedFields` shows before/after values
- `payload` contains the update data
- `previousData` contains original data

### 3. Delete Operation
- Audit log entry created with `action: 'delete'`
- `previousData` contains the deleted data
- `payload` is null
- `changedFields` is null

### 4. API Response Format
```json
{
  "data": [
    {
      "id": 1,
      "contentType": "api::article.article",
      "recordId": "123",
      "action": "create",
      "timestamp": "2023-12-01T10:30:00.000Z",
      "userId": 1,
      "userEmail": "admin@example.com",
      "payload": {...},
      "changedFields": null,
      "previousData": null
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "pageSize": 25,
      "total": 1,
      "pageCount": 1
    }
  }
}
```

## Performance Testing

### Load Testing Script

```javascript
// test-load.js
const axios = require('axios');

async function testAuditLogPerformance() {
  const baseURL = 'http://localhost:1337';
  const token = 'YOUR_AUTH_TOKEN';
  
  console.log('Starting performance test...');
  
  const start = Date.now();
  
  // Create 100 articles rapidly
  const promises = [];
  for (let i = 0; i < 100; i++) {
    promises.push(
      axios.post(`${baseURL}/api/articles`, {
        data: { title: `Article ${i}`, content: `Content ${i}` }
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
    );
  }
  
  await Promise.all(promises);
  
  const end = Date.now();
  console.log(`Created 100 articles in ${end - start}ms`);
  
  // Check audit logs were created
  const auditResponse = await axios.get(`${baseURL}/api/audit-logs`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  
  console.log(`Audit logs created: ${auditResponse.data.meta.pagination.total}`);
}

// Run: node test-load.js
```

## Database Testing

### Verify Database Schema

```sql
-- Check if audit logs table exists
DESCRIBE strapi_audit_logs;

-- Verify indexes (for performance)
SHOW INDEX FROM strapi_audit_logs;

-- Check recent audit logs
SELECT * FROM strapi_audit_logs 
ORDER BY timestamp DESC 
LIMIT 10;

-- Test filtering performance
SELECT COUNT(*) FROM strapi_audit_logs 
WHERE contentType = 'api::article.article' 
AND action = 'update'
AND timestamp >= DATE_SUB(NOW(), INTERVAL 7 DAY);
```

## Automated Testing in CI/CD

### GitHub Actions Example

```yaml
name: Test Audit Logs Plugin

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:13
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm install
        
      - name: Run unit tests
        run: npm test packages/plugins/audit-logs
        
      - name: Build test app
        run: |
          npx create-strapi-app@latest test-app --quickstart --no-run
          cp -r packages/plugins/audit-logs test-app/src/plugins/
          
      - name: Run integration tests
        run: |
          cd test-app
          npm run strapi build
          npm run test:integration
```

## Troubleshooting Tests

### Common Issues

1. **Plugin not loading**: Check plugin registration in `config/plugins.js`
2. **Database errors**: Ensure audit_logs table is created
3. **Permission errors**: Verify user has `audit-logs.read` permission
4. **Lifecycle hooks not firing**: Check if plugin bootstrap completed successfully

### Debug Commands

```bash
# Check plugin status
curl -X GET http://localhost:1337/admin/plugins \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Check database tables
npm run strapi console
> strapi.db.connection.raw('SHOW TABLES LIKE "%audit%"')

# Check registered permissions
> strapi.admin.services.permission.actionProvider.values()
```

## Test Data Cleanup

```javascript
// cleanup-test-data.js
async function cleanup() {
  // Delete test audit logs
  await strapi.db.query('plugin::audit-logs.audit-log').deleteMany({
    where: {
      userEmail: { $contains: 'test' }
    }
  });
  
  console.log('Test data cleaned up');
}
```

This comprehensive testing approach ensures the audit logging feature works correctly across all scenarios and maintains data integrity while providing the required functionality.