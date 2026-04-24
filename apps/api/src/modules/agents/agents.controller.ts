import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { parseWhere } from '../../common/utils/query.util';
import { ListQueryDto } from '../../common/dto/list-query.dto';
import { AgentsService } from './agents.service';
import { CreateAgentDto, UpdateAgentDto } from './dto/agent.dto';

@ApiTags('agents')
@ApiBearerAuth()
@Controller('agents')
export class AgentsController {
  constructor(private readonly service: AgentsService) {}
  @Get() list(@Query() q: ListQueryDto) {
    return this.service.list({ sort: q.sort, limit: q.limit, offset: q.offset, where: parseWhere(q.where),
      includeInactive: q.include_inactive });
  }
  @Get(':id') findOne(@Param('id') id: string) { return this.service.findById(id); }
  @Post() create(@Body() dto: CreateAgentDto) { return this.service.create(dto); }
  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateAgentDto) { return this.service.update(id, dto); }
  @Delete(':id') remove(@Param('id') id: string) { return this.service.remove(id); }
}
