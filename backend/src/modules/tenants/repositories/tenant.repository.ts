import { prisma } from '../../../config/database';

export class TenantRepository {
  async findById(id: string) {
    return prisma.tenant.findUnique({ where: { id } });
  }

  async getApiKeys(tenantId: string) {
    return prisma.apiKey.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        isActive: true,
        lastUsedAt: true,
        createdAt: true,
        revokedAt: true,
      },
    });
  }

  async createApiKey(tenantId: string, name: string, keyHash: string, keyPrefix: string) {
    return prisma.apiKey.create({
      data: { tenantId, name, keyHash, keyPrefix },
    });
  }

  async revokeApiKey(id: string, tenantId: string) {
    return prisma.apiKey.updateMany({
      where: { id, tenantId },
      data: { isActive: false, revokedAt: new Date() },
    });
  }
}
