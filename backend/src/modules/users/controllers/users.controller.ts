import { Response } from 'express';
import { UsersService } from '../services/users.service';
import { asyncHandler, createSuccessResponse } from '../../../utils/errors';
import { AuthenticatedRequest } from '../../../middleware/auth';

const usersService = new UsersService();

export const getUsers = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const users = await usersService.getUsers(req.user!.tenantId);
  res.json(createSuccessResponse(users));
});

export const updateRole = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const result = await usersService.updateRole(
    req.params.userId, req.user!.tenantId, req.body.role, req.user!.id
  );
  res.json(createSuccessResponse(result, 'Role updated'));
});

export const removeUser = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const result = await usersService.removeUser(
    req.params.userId, req.user!.tenantId, req.user!.id
  );
  res.json(createSuccessResponse(result, 'User removed'));
});
