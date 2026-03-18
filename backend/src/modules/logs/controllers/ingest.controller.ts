import { Response } from 'express';
import { IngestService } from '../services/ingest.service';
import { asyncHandler, createSuccessResponse } from '../../../utils/errors';
import { ApiKeyRequest } from '../../../middleware/apiKeyAuth';

const ingestService = new IngestService();

export const ingestLog = asyncHandler(async (req: ApiKeyRequest, res: Response) => {
  const { message, level, timestamp, metadata, source } = req.body;

  const result = await ingestService.ingest({
    tenantId: req.tenant!.id,
    message,
    level,
    timestamp,
    metadata,
    source,
  });

  res.status(202).json(
    createSuccessResponse(result, 'Log accepted for processing')
  );
});

export const getQueueDepth = asyncHandler(async (req: ApiKeyRequest, res: Response) => {
  const depth = await ingestService.getQueueDepth();
  res.json(createSuccessResponse({ queueDepth: depth }));
});
