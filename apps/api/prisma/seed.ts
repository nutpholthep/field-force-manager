import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import {
  aIAgentData,
  zoneData,
  teamRoleData,
  teamData,
  customerData,
  siteData,
  skillData,
  priorityMasterData,
  stuckReasonData,
  materialCategoryData,
  materialData,
  serviceTypeData,
  workflowData,
  technicianData,
  projectData,
  workOrderData,
  workOrderStepDataData,
  notificationData
} from './seed-data';

const prisma = new PrismaClient();

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

  // eslint-disable-next-line no-console
  console.log(`[seed] Inserting hardcoded seed data arrays...`);

  // Ordered array to respect Foreign Key constraints
  const datasets = [
    { modelName: 'aIAgent', items: aIAgentData },
    { modelName: 'zone', items: zoneData },
    { modelName: 'teamRole', items: teamRoleData },
    { modelName: 'team', items: teamData },
    { modelName: 'customer', items: customerData },
    { modelName: 'site', items: siteData },
    { modelName: 'skill', items: skillData },
    { modelName: 'priorityMaster', items: priorityMasterData },
    { modelName: 'stuckReason', items: stuckReasonData },
    { modelName: 'materialCategory', items: materialCategoryData },
    { modelName: 'material', items: materialData },
    { modelName: 'serviceType', items: serviceTypeData },
    { modelName: 'workflow', items: workflowData },
    { modelName: 'technician', items: technicianData },
    { modelName: 'project', items: projectData },
    { modelName: 'workOrder', items: workOrderData },
    { modelName: 'workOrderStepData', items: workOrderStepDataData },
    { modelName: 'notification', items: notificationData }
  ];

  for (const { modelName, items } of datasets) {
    if (items.length === 0) continue;
    // eslint-disable-next-line no-console
    console.log(`Seeding ${items.length} records for ${modelName}...`);
    for (const item of items) {
      // Safely perform upsert to prevent unique constraint failures on re-seeding
      const whereDef: Record<string, any> = {};
      const obj = item as any;
      if (obj.id) whereDef.id = obj.id;
      else if (obj.order_number) whereDef.order_number = obj.order_number;
      else if (obj.code) whereDef.code = obj.code;
      else continue;

      await (prisma[modelName as keyof PrismaClient] as any).upsert({
        where: whereDef,
        create: item,
        update: item,
      });
    }
  }

  // eslint-disable-next-line no-console
  console.log(`[seed] Done! Database thoroughly seeded without external files.`);
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
