import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { AuthRepository } from '../repositories/auth.repository';
import { AppError } from '../../../utils/errors';
import { generateSlug } from '../../../utils/crypto';
import { RegisterInput, LoginInput } from '../../../utils/validation';
import { prisma } from '../../../config/database';

const SALT_ROUNDS = 12;

export class AuthService {
  private authRepo = new AuthRepository();

  async register(input: RegisterInput) {
    const { email, password, name, organizationName } = input;

    const existing = await prisma.user.findFirst({ where: { email } });
    if (existing) throw AppError.conflict('An account with this email already exists');

    const slug = generateSlug(organizationName);
    const existingTenant = await prisma.tenant.findFirst({
      where: { OR: [{ name: organizationName }, { slug }] },
    });
    if (existingTenant) throw AppError.conflict('Organization name already taken');

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const { user, tenant } = await this.authRepo.createTenantWithAdmin({
      tenantName: organizationName,
      tenantSlug: slug,
      email,
      passwordHash,
      name,
    });

    const token = this.generateToken(user.id, user.role, tenant.id);

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenantId: tenant.id,
        tenantName: tenant.name,
        tenantSlug: tenant.slug,
      },
    };
  }

  async login(input: LoginInput) {
    const { email, password } = input;

    const user = await this.authRepo.findUserByEmail(email);
    if (!user) throw AppError.unauthorized('Invalid email or password');

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) throw AppError.unauthorized('Invalid email or password');

    const token = this.generateToken(user.id, user.role, user.tenantId);

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenantId: user.tenantId,
        tenantName: user.tenant.name,
        tenantSlug: user.tenant.slug,
      },
    };
  }

  async getMe(userId: string, tenantId: string) {
    const user = await this.authRepo.findUserById(userId, tenantId);
    if (!user) throw AppError.notFound('User');

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      tenantId: user.tenantId,
      tenantName: tenant?.name,
      tenantSlug: tenant?.slug,
    };
  }

  private generateToken(userId: string, role: string, tenantId: string): string {
    const secret = process.env.JWT_SECRET!;
    const expiresIn = (process.env.JWT_EXPIRES_IN || '7d') as SignOptions['expiresIn'];
    return jwt.sign({ userId, role, tenantId }, secret, { expiresIn });
  }
}