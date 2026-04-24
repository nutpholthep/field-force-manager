import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { parseWhere } from '../../common/utils/query.util';
import { ListQueryDto } from '../../common/dto/list-query.dto';
import { TeamRolesService } from './team-roles.service';
import { CreateTeamRoleDto, UpdateTeamRoleDto } from './dto/team-role.dto';

@ApiTags('team-roles')
@ApiBearerAuth()
@Controller('team-roles')
export class TeamRolesController {
  constructor(private readonly service: TeamRolesService) {}
  @Get() list(@Query() q: ListQueryDto) {
    return this.service.list({ sort: q.sort, limit: q.limit, offset: q.offset, where: parseWhere(q.where),
      includeInactive: q.include_inactive });
  }
  @Get(':id') findOne(@Param('id') id: string) { return this.service.findById(id); }
  @Post() create(@Body() dto: CreateTeamRoleDto) { return this.service.create(dto); }
  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateTeamRoleDto) { return this.service.update(id, dto); }
  @Delete(':id') remove(@Param('id') id: string) { return this.service.remove(id); }
}
