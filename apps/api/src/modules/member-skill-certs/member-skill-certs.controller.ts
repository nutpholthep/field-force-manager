import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { parseWhere } from '../../common/utils/query.util';
import { ListQueryDto } from '../../common/dto/list-query.dto';
import { MemberSkillCertsService } from './member-skill-certs.service';
import { CreateMemberSkillCertDto, UpdateMemberSkillCertDto } from './dto/member-skill-cert.dto';

@ApiTags('member-skill-certs')
@ApiBearerAuth()
@Controller('member-skill-certs')
export class MemberSkillCertsController {
  constructor(private readonly service: MemberSkillCertsService) {}
  @Get() list(@Query() q: ListQueryDto) {
    return this.service.list({ sort: q.sort, limit: q.limit, offset: q.offset, where: parseWhere(q.where) });
  }
  @Get(':id') findOne(@Param('id') id: string) { return this.service.findById(id); }
  @Post() create(@Body() dto: CreateMemberSkillCertDto) { return this.service.create(dto); }
  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateMemberSkillCertDto) { return this.service.update(id, dto); }
  @Delete(':id') remove(@Param('id') id: string) { return this.service.remove(id); }
}
