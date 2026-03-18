import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { asyncHandler, createSuccessResponse } from '../../../utils/errors';
import { AuthenticatedRequest } from '../../../middleware/auth';

const authService = new AuthService();

export const register = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.register(req.body);
  res.status(201).json(createSuccessResponse(result, 'Account created successfully'));
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.login(req.body);
  res.json(createSuccessResponse(result, 'Login successful'));
});

export const getMe = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const user = await authService.getMe(req.user!.id, req.user!.tenantId);
  res.json(createSuccessResponse(user));
});
