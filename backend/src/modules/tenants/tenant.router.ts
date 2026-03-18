import { Router } from 'express';
import { getTenant, getApiKeys, createApiKey, revokeApiKey } from './controllers/tenant.controller';
import { authenticate, requireAdmin, requireMember } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { createApiKeySchema } from '../../utils/validation';

const router = Router();
router.use(authenticate);

router.get('/', requireMember, getTenant);
router.get('/api-keys', requireMember, getApiKeys);
router.post('/api-keys', requireAdmin, validate(createApiKeySchema), createApiKey);
router.delete('/api-keys/:keyId', requireAdmin, revokeApiKey);

export default router;
