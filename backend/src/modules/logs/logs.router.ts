import { Router } from 'express';
import { getLogs, getRecentLogs } from './controllers/logs.controller';
import { authenticate, requireMember } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { getLogsSchema } from '../../utils/validation';

const router = Router();

router.use(authenticate, requireMember);

router.get('/', validate(getLogsSchema), getLogs);
router.get('/recent', getRecentLogs);

export default router;
