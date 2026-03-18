import { Response } from 'express';
import { AnalyticsService } from '../services/analytics.service';
import { asyncHandler, createSuccessResponse } from '../../../utils/errors';
import { AuthenticatedRequest } from '../../../middleware/auth';

const analyticsService = new AnalyticsService();

export const getStats = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const stats = await analyticsService.getStats(req.user!.tenantId);
  res.json(createSuccessResponse(stats));
});
