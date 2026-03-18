import { Router } from 'express';
import { ingestLog } from './controllers/ingest.controller';
import { apiKeyAuth } from '../../middleware/apiKeyAuth';
import { ingestRateLimiter } from '../../middleware/rateLimiter';
import { validate } from '../../middleware/validate';
import { ingestLogSchema } from '../../utils/validation';

const router = Router();

// POST /api/v1/logs/ingest
router.post(
  '/',
  ingestRateLimiter,
  apiKeyAuth,
  validate(ingestLogSchema),
  ingestLog
);

export default router;
