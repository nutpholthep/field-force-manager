import { Module } from '@nestjs/common';
import { TeamRolesController } from './team-roles.controller';
import { TeamRolesService } from './team-roles.service';

@Module({
  controllers: [TeamRolesController],
  providers: [TeamRolesService],
  exports: [TeamRolesService],
})
export class TeamRolesModule {}
