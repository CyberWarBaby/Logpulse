import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { generateApiKey, generateSlug } from '../utils/crypto';

const prisma = new PrismaClient();

// Seed credentials come from environment variables — never hardcoded
const ADMIN_EMAIL    = process.env.SEED_ADMIN_EMAIL    || 'admin@example.com';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD;
const MEMBER_EMAIL   = process.env.SEED_MEMBER_EMAIL   || 'member@example.com';
const ORG_NAME       = process.env.SEED_ORG_NAME       || 'My Organization';

if (!ADMIN_PASSWORD) {
  console.error('❌ SEED_ADMIN_PASSWORD is required. Set it in your .env file.');
  process.exit(1);
}

async function main() {
  console.log('🌱 Seeding database...');

  const slug = generateSlug(ORG_NAME);
  const tenant = await prisma.tenant.upsert({
    where: { slug },
    update: {},
    create: { name: ORG_NAME, slug },
  });
  console.log(`✅ Tenant: ${tenant.name}`);

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD!, 12);

  const admin = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {},
    create: {
      email: ADMIN_EMAIL,
      passwordHash,
      name: 'Admin',
      role: 'ADMIN',
      tenantId: tenant.id,
    },
  });
  console.log(`✅ Admin user: ${admin.email}`);

  const member = await prisma.user.upsert({
    where: { email: MEMBER_EMAIL },
    update: {},
    create: {
      email: MEMBER_EMAIL,
      passwordHash,
      name: 'Member',
      role: 'MEMBER',
      tenantId: tenant.id,
    },
  });
  console.log(`✅ Member user: ${member.email}`);

  const existingKey = await prisma.apiKey.findFirst({ where: { tenantId: tenant.id } });
  if (!existingKey) {
    const { raw, prefix, hash } = generateApiKey();
    await prisma.apiKey.create({
      data: { name: 'Default Key', keyHash: hash, keyPrefix: prefix, tenantId: tenant.id },
    });
    console.log(`\n🔑 API Key (copy now — shown once):\n   ${raw}\n`);
  }

  const levels = ['info', 'warn', 'error', 'debug'] as const;
  const messages = [
    'Request processed successfully', 'Cache miss — fetching from DB',
    'Slow query detected (>200ms)', 'Payment webhook received',
    'Email dispatch succeeded', 'Rate limit threshold approaching',
    'Unhandled exception in worker process', 'Memory usage elevated',
    'Scheduled job completed', 'Config reload triggered',
  ];

  await prisma.log.createMany({
    data: Array.from({ length: 200 }, (_, i) => ({
      tenantId: tenant.id,
      message: messages[i % messages.length],
      level: levels[Math.floor(Math.random() * levels.length)],
      timestamp: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
      metadata: { requestId: `req_${Math.random().toString(36).slice(2)}` },
    })),
  });
  console.log('✅ Sample logs created');
  console.log('\n🎉 Seed complete.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
