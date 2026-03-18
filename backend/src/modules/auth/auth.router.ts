import { Router } from 'express';
import { register, login, getMe } from './controllers/auth.controller';
import { validate } from '../../middleware/validate';
import { registerSchema, loginSchema } from '../../utils/validation';
import { authenticate } from '../../middleware/auth';
import { authRateLimiter } from '../../middleware/rateLimiter';

const router = Router();

router.post('/register', authRateLimiter, validate(registerSchema), register);
router.post('/login', authRateLimiter, validate(loginSchema), login);
router.get('/me', authenticate, getMe);

export default router;
