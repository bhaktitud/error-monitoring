import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  await prisma.plan.upsert({
    where: { name: 'Free' },
    update: {},
    create: {
      name: 'Free',
      price: 0,
      features: {
        projects: 1,
        eventsPerMonth: 1000,
        retentionDays: 7,
        alert: ['email'],
        teamMembers: 1,
      },
    },
  });
  await prisma.plan.upsert({
    where: { name: 'Starter' },
    update: {},
    create: {
      name: 'Starter',
      price: 99000,
      features: {
        projects: 5,
        eventsPerMonth: 20000,
        retentionDays: 30,
        alert: ['email', 'slack'],
        teamMembers: 5,
        webhook: true,
      },
    },
  });
  await prisma.plan.upsert({
    where: { name: 'Pro' },
    update: {},
    create: {
      name: 'Pro',
      price: 399000,
      features: {
        projects: 20,
        eventsPerMonth: 100000,
        retentionDays: 90,
        alert: ['email', 'slack', 'webhook'],
        teamMembers: 20,
        prioritySupport: true,
      },
    },
  });
  await prisma.plan.upsert({
    where: { name: 'Enterprise' },
    update: {},
    create: {
      name: 'Enterprise',
      price: null,
      features: {
        projects: 'unlimited',
        eventsPerMonth: 'custom',
        retentionDays: 'custom',
        allProFeatures: true,
        sso: true,
        sla: true,
        onboarding: true,
      },
    },
  });

  const free = await prisma.plan.findUnique({ where: { name: 'Free' } });
  const starter = await prisma.plan.findUnique({ where: { name: 'Starter' } });
  const pro = await prisma.plan.findUnique({ where: { name: 'Pro' } });
  const enterprise = await prisma.plan.findUnique({ where: { name: 'Enterprise' } });

  const password = await bcrypt.hash('password123', 10);

  await prisma.user.create({
    data: {
      email: 'freeuser@email.com',
      passwordHash: password,
      emailVerified: true,
      name: 'User Free',
      planId: free?.id,
    },
  });
  await prisma.user.create({
    data: {
      email: 'starter@email.com',
      passwordHash: password,
      emailVerified: true,
      name: 'User Starter',
      planId: starter?.id,
    },
  });
  await prisma.user.create({
    data: {
      email: 'pro@email.com',
      passwordHash: password,
      emailVerified: true,
      name: 'User Pro',
      planId: pro?.id,
    },
  });
  await prisma.user.create({
    data: {
      email: 'enterprise@email.com',
      passwordHash: password,
      emailVerified: true,
      name: 'User Enterprise',
      planId: enterprise?.id,
    },
  });

  console.log('Seed data plan & user selesai!');
  console.log('Akun login untuk testing:');
  console.log('Free      : freeuser@email.com / password123');
  console.log('Starter   : starter@email.com / password123');
  console.log('Pro       : pro@email.com / password123');
  console.log('Enterprise: enterprise@email.com / password123');
}

main().finally(() => prisma.$disconnect()); 