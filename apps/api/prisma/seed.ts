import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as path from 'path';
import { csvDatasetExists, resolveDefaultCsvDir, seedFromCsvDir } from './csv-seed';

const prisma = new PrismaClient();

async function seedFallbackMasters() {
  const priorities = [
    { name: 'Critical', code: 'critical', color: '#ef4444', duration_value: 1, duration_unit: 'hours' as const },
    { name: 'High', code: 'high', color: '#f97316', duration_value: 4, duration_unit: 'hours' as const },
    { name: 'Medium', code: 'medium', color: '#f59e0b', duration_value: 1, duration_unit: 'days' as const },
    { name: 'Low', code: 'low', color: '#22c55e', duration_value: 3, duration_unit: 'days' as const },
  ];
  for (const p of priorities) {
    await prisma.priorityMaster.upsert({
      where: { id: `seed-prio-${p.code}` },
      update: {},
      create: { id: `seed-prio-${p.code}`, ...p },
    });
  }

  const stuckReasons = [
    { name: 'Waiting for parts', code: 'parts-wait', category: 'parts' as const },
    { name: 'No site access', code: 'no-access', category: 'access' as const },
    { name: 'Technical issue', code: 'tech-issue', category: 'technical' as const },
    { name: 'Customer unavailable', code: 'cust-na', category: 'customer' as const },
    { name: 'Bad weather', code: 'weather', category: 'weather' as const },
  ];
  for (const r of stuckReasons) {
    await prisma.stuckReason.upsert({
      where: { code: r.code },
      update: {},
      create: r,
    });
  }
}

async function main() {
  const adminEmail = 'admin@ffm.local';
  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existing) {
    await prisma.user.create({
      data: {
        email: adminEmail,
        password_hash: await bcrypt.hash('admin123', 12),
        full_name: 'System Administrator',
        role: 'admin',
      },
    });
    // eslint-disable-next-line no-console
    console.log(`Seeded admin user: ${adminEmail} / admin123`);
  }

  const csvDir = process.env.SEED_CSV_DIR
    ? path.resolve(process.env.SEED_CSV_DIR)
    : resolveDefaultCsvDir();

  if (csvDatasetExists(csvDir)) {
    await seedFromCsvDir(prisma, csvDir);
  } else {
    // eslint-disable-next-line no-console
    console.log(
      `[seed] No CSV bundle at ${csvDir}. Set SEED_CSV_DIR to your export folder (e.g. ...\\\\iCrewForce\\\\database). Using built-in master seed only.`,
    );
    await seedFallbackMasters();
  }
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
