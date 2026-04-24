import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { parseWhere } from '../../common/utils/query.util';
import { ListQueryDto } from '../../common/dto/list-query.dto';
import { SkillsService } from './skills.service';
import { CreateSkillDto, UpdateSkillDto } from './dto/skill.dto';

@ApiTags('skills')
@ApiBearerAuth()
@Controller('skills')
export class SkillsController {
  constructor(private readonly service: SkillsService) {}
  @Get() list(@Query() q: ListQueryDto) {
    return this.service.list({ sort: q.sort, limit: q.limit, offset: q.offset, where: parseWhere(q.where),
      includeInactive: q.include_inactive });
  }
  @Get(':id') findOne(@Param('id') id: string) { return this.service.findById(id); }
  @Post() create(@Body() dto: CreateSkillDto) { return this.service.create(dto); }
  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateSkillDto) { return this.service.update(id, dto); }
  @Delete(':id') remove(@Param('id') id: string) { return this.service.remove(id); }
}
