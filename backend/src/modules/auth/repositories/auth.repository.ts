import { prisma } from '../../../config/database';
import { User, Tenant } from '@prisma/client';

export class AuthRepository {
  async findUserByEmail(email: string): Promise<(User & { tenant: Tenant }) | null> {
    return prisma.user.findFirst({
      where: { email, isActive: true },
      include: { tenant: true },
    });
  }

  async createTenantWithAdmin(data: {
    tenantName: string;
    tenantSlug: string;
    email: string;
    passwordHash: string;
    name: string;
  }): Promise<{ user: User; tenant: Tenant }> {
    return prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: data.tenantName,
          slug: data.tenantSlug,
        },
      });

      const user = await tx.user.create({
        data: {
          email: data.email,
          passwordHash: data.passwordHash,
          name: data.name,
          role: 'ADMIN',
          tenantId: tenant.id,
        },
      });

      return { user, tenant };
    });
  }

  async findUserById(id: string, tenantId: string): Promise<User | null> {
    return prisma.user.findFirst({
      where: { id, tenantId, isActive: true },
    });
  }
}
