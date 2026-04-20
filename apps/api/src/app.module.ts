import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { JwtAuthGuard } from './modules/auth/jwt-auth.guard';
import { UsersModule } from './modules/users/users.module';
import { CustomersModule } from './modules/customers/customers.module';
import { SitesModule } from './modules/sites/sites.module';
import { ZonesModule } from './modules/zones/zones.module';
import { SkillsModule } from './modules/skills/skills.module';
import { PrioritiesModule } from './modules/priorities/priorities.module';
import { StuckReasonsModule } from './modules/stuck-reasons/stuck-reasons.module';
import { MaterialCategoriesModule } from './modules/material-categories/material-categories.module';
import { MaterialsModule } from './modules/materials/materials.module';
import { ServiceTypesModule } from './modules/service-types/service-types.module';
import { WorkflowsModule } from './modules/workflows/workflows.module';
import { TeamRolesModule } from './modules/team-roles/team-roles.module';
import { TeamsModule } from './modules/teams/teams.module';
import { TechniciansModule } from './modules/technicians/technicians.module';
import { MemberSkillCertsModule } from './modules/member-skill-certs/member-skill-certs.module';
import { TechnicianAttendanceModule } from './modules/technician-attendance/technician-attendance.module';
import { WorkOrdersModule } from './modules/work-orders/work-orders.module';
import { WorkOrderMaterialsModule } from './modules/work-order-materials/work-order-materials.module';
import { WorkOrderStepDataModule } from './modules/work-order-step-data/work-order-step-data.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AgentsModule } from './modules/agents/agents.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    CustomersModule,
    SitesModule,
    ZonesModule,
    SkillsModule,
    PrioritiesModule,
    StuckReasonsModule,
    MaterialCategoriesModule,
    MaterialsModule,
    ServiceTypesModule,
    WorkflowsModule,
    TeamRolesModule,
    TeamsModule,
    TechniciansModule,
    MemberSkillCertsModule,
    TechnicianAttendanceModule,
    WorkOrdersModule,
    WorkOrderMaterialsModule,
    WorkOrderStepDataModule,
    ProjectsModule,
    NotificationsModule,
    AgentsModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: JwtAuthGuard }],
})
export class AppModule {}
