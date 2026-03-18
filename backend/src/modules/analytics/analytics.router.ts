import { Router } from 'express';
import { getStats } from './controllers/analytics.controller';
import { authenticate, requireMember } from '../../middleware/auth';

const router = Router();
router.use(authenticate, requireMember);
router.get('/stats', getStats);
export default router;
