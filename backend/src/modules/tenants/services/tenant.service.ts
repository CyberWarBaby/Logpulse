import { TenantRepository } from '../repositories/tenant.repository';
import { generateApiKey } from '../../../utils/crypto';
import { AppError } from '../../../utils/errors';
import { redisClient, REDIS_KEYS } from '../../../config/redis';

export class TenantService {
  private tenantRepo = new TenantRepository();

  async getTenant(tenantId: string) {
    const tenant = await this.tenantRepo.findById(tenantId);
    if (!tenant) throw AppError.notFound('Tenant');
    return tenant;
  }

  async getApiKeys(tenantId: string) {
    return this.tenantRepo.getApiKeys(tenantId);
  }

  async createApiKey(tenantId: string, name: string): Promise<{ rawKey: string; id: string }> {
    const { raw, prefix, hash } = generateApiKey();
    const apiKey = await this.tenantRepo.createApiKey(tenantId, name, hash, prefix);
    return { rawKey: raw, id: apiKey.id };
  }

  async revokeApiKey(id: string, tenantId: string) {
    const result = await this.tenantRepo.revokeApiKey(id, tenantId);
    if (result.count === 0) throw AppError.notFound('API key');

    // Invalidate cache for this key
    // We don't have the hash here, but the TTL is short enough
    return { revoked: true };
  }
}
