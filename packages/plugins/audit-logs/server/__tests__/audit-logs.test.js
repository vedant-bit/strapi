'use strict';

const auditLogsService = require('../services/audit-logs');

describe('Audit Logs Service', () => {
  let mockStrapi;

  beforeEach(() => {
    mockStrapi = {
      db: {
        query: jest.fn(() => ({
          create: jest.fn(),
          findPage: jest.fn(),
          findOne: jest.fn(),
          deleteMany: jest.fn(),
          count: jest.fn(),
        })),
      },
      log: {
        error: jest.fn(),
        info: jest.fn(),
      },
      config: {
        get: jest.fn(() => ({ enabled: true })),
      },
      requestContext: {
        get: jest.fn(() => ({
          state: {
            user: { id: 1, email: 'test@example.com' },
          },
        })),
      },
    };
  });

  test('should save audit log', async () => {
    const service = auditLogsService({ strapi: mockStrapi });
    const mockCreate = jest.fn().mockResolvedValue({ id: 1 });
    mockStrapi.db.query().create = mockCreate;

    const logData = {
      contentType: 'api::article.article',
      recordId: '123',
      action: 'create',
      userId: 1,
      userEmail: 'test@example.com',
    };

    await service.saveAuditLog(logData);

    expect(mockCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        ...logData,
        timestamp: expect.any(Date),
      }),
    });
  });

  test('should check if content type should be audited', () => {
    const service = auditLogsService({ strapi: mockStrapi });

    expect(service.shouldAuditContentType('api::article.article')).toBe(true);
    expect(service.shouldAuditContentType('admin::user')).toBe(false);
    expect(service.shouldAuditContentType('strapi::core-store')).toBe(false);
    expect(service.shouldAuditContentType('plugin::audit-logs.audit-log')).toBe(false);
  });

  test('should calculate diff between objects', () => {
    const service = auditLogsService({ strapi: mockStrapi });

    const oldData = { title: 'Old Title', content: 'Same content' };
    const newData = { title: 'New Title', content: 'Same content' };

    const diff = service.calculateDiff(oldData, newData);

    expect(diff).toEqual({
      title: {
        from: 'Old Title',
        to: 'New Title',
      },
    });
  });

  test('should sanitize sensitive data', () => {
    const service = auditLogsService({ strapi: mockStrapi });

    const data = {
      email: 'test@example.com',
      password: 'secret123',
      resetPasswordToken: 'token123',
      title: 'Article Title',
    };

    const sanitized = service.sanitizeData(data);

    expect(sanitized).toEqual({
      email: 'test@example.com',
      title: 'Article Title',
    });
    expect(sanitized.password).toBeUndefined();
    expect(sanitized.resetPasswordToken).toBeUndefined();
  });
});