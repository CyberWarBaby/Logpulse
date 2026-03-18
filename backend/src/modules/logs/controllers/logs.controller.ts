import { Response } from 'express';
import { LogsService } from '../services/logs.service';
import { asyncHandler, createPaginatedResponse } from '../../../utils/errors';
import { AuthenticatedRequest } from '../../../middleware/auth';

const logsService = new LogsService();

export const getLogs = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const tenantId = req.user!.tenantId;
  const { logs, total, page, limit } = await logsService.getLogs(tenantId, req.query as any);
  res.json(createPaginatedResponse(logs, total, page, limit));
});

export const getRecentLogs = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const tenantId = req.user!.tenantId;
  const logs = await logsService.getRecentLogs(tenantId, 100);
  res.json({ success: true, data: logs });
});
