import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    name: z.string().min(2, 'Name must be at least 2 characters').max(100),
    organizationName: z.string().min(2, 'Organization name required').max(100),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1, 'Password is required'),
  }),
});

export const ingestLogSchema = z.object({
  body: z.object({
    message: z.string().min(1, 'Message is required').max(10000),
    level: z.enum(['info', 'warn', 'error', 'debug']),
    timestamp: z.string().datetime().optional(),
    metadata: z.record(z.unknown()).optional(),
    source: z.string().max(100).optional(),
  }),
});

export const getLogsSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    level: z.enum(['info', 'warn', 'error', 'debug']).optional(),
    search: z.string().optional(),
    from: z.string().datetime().optional(),
    to: z.string().datetime().optional(),
  }),
});

export const createApiKeySchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100),
  }),
});

export const updateUserRoleSchema = z.object({
  body: z.object({
    role: z.enum(['ADMIN', 'MEMBER']),
  }),
  params: z.object({
    userId: z.string().uuid(),
  }),
});

export type RegisterInput = z.infer<typeof registerSchema>['body'];
export type LoginInput = z.infer<typeof loginSchema>['body'];
export type IngestLogInput = z.infer<typeof ingestLogSchema>['body'];
export type GetLogsInput = z.infer<typeof getLogsSchema>['query'];
