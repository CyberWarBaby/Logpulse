import { UsersRepository } from '../repositories/users.repository';
import { AppError } from '../../../utils/errors';

export class UsersService {
  private usersRepo = new UsersRepository();

  async getUsers(tenantId: string) {
    return this.usersRepo.findByTenant(tenantId);
  }

  async updateRole(userId: string, tenantId: string, role: 'ADMIN' | 'MEMBER', requesterId: string) {
    if (userId === requesterId) throw AppError.badRequest('Cannot change your own role');
    const result = await this.usersRepo.updateRole(userId, tenantId, role);
    if (result.count === 0) throw AppError.notFound('User');
    return { updated: true };
  }

  async removeUser(userId: string, tenantId: string, requesterId: string) {
    if (userId === requesterId) throw AppError.badRequest('Cannot remove yourself');
    const result = await this.usersRepo.deactivate(userId, tenantId);
    if (result.count === 0) throw AppError.notFound('User');
    return { removed: true };
  }
}
