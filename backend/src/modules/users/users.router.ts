import { Router } from 'express';
import { getUsers, updateRole, removeUser } from './controllers/users.controller';
import { authenticate, requireAdmin, requireMember } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { updateUserRoleSchema } from '../../utils/validation';

const router = Router();
router.use(authenticate);

router.get('/', requireMember, getUsers);
router.patch('/:userId/role', requireAdmin, validate(updateUserRoleSchema), updateRole);
router.delete('/:userId', requireAdmin, removeUser);

export default router;
