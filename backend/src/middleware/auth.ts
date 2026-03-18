import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../utils/errors';
import { prisma } from '../config/database';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
    tenantId: string;
  };
}

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(AppError.unauthorized('No token provided'));
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

    // Fetch fresh user data to ensure account is still active
    const user = await prisma.user.findFirst({
      where: {
        id: decoded.userId,
        tenantId: decoded.tenantId,
        isActive: true,
      },
      select: { id: true, email: true, name: true, role: true, tenantId: true },
    });

    if (!user) {
      return next(AppError.unauthorized('User not found or inactive'));
    }

    req.user = user;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return next(AppError.unauthorized('Token expired'));
    }
    if (err instanceof jwt.JsonWebTokenError) {
      return next(AppError.unauthorized('Invalid token'));
    }
    next(err);
  }
};

export const requireRole = (...roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(AppError.unauthorized());
    }

    if (!roles.includes(req.user.role)) {
      return next(
        AppError.forbidden(`This action requires one of: ${roles.join(', ')} role`)
      );
    }

    next();
  };
};

export const requireAdmin = requireRole('ADMIN');
export const requireMember = requireRole('ADMIN', 'MEMBER');
