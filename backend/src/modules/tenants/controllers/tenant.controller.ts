import { Response } from 'express';
import { TenantService } from '../services/tenant.service';
import { asyncHandler, createSuccessResponse } from '../../../utils/errors';
import { AuthenticatedRequest } from '../../../middleware/auth';

const tenantService = new TenantService();

export const getTenant = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const tenant = await tenantService.getTenant(req.user!.tenantId);
  res.json(createSuccessResponse(tenant));
});

export const getApiKeys = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const keys = await tenantService.getApiKeys(req.user!.tenantId);
  res.json(createSuccessResponse(keys));
});

export const createApiKey = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { name } = req.body;
  const result = await tenantService.createApiKey(req.user!.tenantId, name);
  res.status(201).json(
    createSuccessResponse(result, '⚠️ Copy this key now - it will not be shown again')
  );
});

export const revokeApiKey = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const result = await tenantService.revokeApiKey(req.params.keyId, req.user!.tenantId);
  res.json(createSuccessResponse(result, 'API key revoked'));
});
