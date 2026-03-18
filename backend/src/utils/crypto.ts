import crypto from 'crypto';

const API_KEY_PREFIX = 'lp_';
const API_KEY_LENGTH = 32;

export const generateApiKey = (): { raw: string; prefix: string; hash: string } => {
  const raw = `${API_KEY_PREFIX}${crypto.randomBytes(API_KEY_LENGTH).toString('hex')}`;
  const prefix = raw.substring(0, 10);
  const hash = hashApiKey(raw);
  return { raw, prefix, hash };
};

export const hashApiKey = (key: string): string => {
  return crypto.createHash('sha256').update(key).digest('hex');
};

export const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50);
};

export const getPaginationParams = (
  page?: string | number,
  limit?: string | number
): { skip: number; take: number; page: number; limit: number } => {
  const parsedPage = Math.max(1, parseInt(String(page || 1)));
  const parsedLimit = Math.min(100, Math.max(1, parseInt(String(limit || 50))));
  return {
    page: parsedPage,
    limit: parsedLimit,
    skip: (parsedPage - 1) * parsedLimit,
    take: parsedLimit,
  };
};
