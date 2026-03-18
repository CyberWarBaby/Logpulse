import { prisma } from '../../../config/database';

export class UsersRepository {
  async findByTenant(tenantId: string) {
    return prisma.user.findMany({
      where: { tenantId },
      select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async updateRole(userId: string, tenantId: string, role: 'ADMIN' | 'MEMBER') {
    return prisma.user.updateMany({
      where: { id: userId, tenantId },
      data: { role },
    });
  }

  async deactivate(userId: string, tenantId: string) {
    return prisma.user.updateMany({
      where: { id: userId, tenantId },
      data: { isActive: false },
    });
  }
}
