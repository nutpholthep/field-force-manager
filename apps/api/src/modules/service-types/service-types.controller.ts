import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { parseWhere } from '../../common/utils/query.util';
import { ListQueryDto } from '../../common/dto/list-query.dto';
import { ServiceTypesService } from './service-types.service';
import { CreateServiceTypeDto, UpdateServiceTypeDto } from './dto/service-type.dto';

@ApiTags('service-types')
@ApiBearerAuth()
@Controller('service-types')
export class ServiceTypesController {
  constructor(private readonly service: ServiceTypesService) {}
  @Get() list(@Query() q: ListQueryDto) {
    return this.service.list({ sort: q.sort, limit: q.limit, offset: q.offset, where: parseWhere(q.where),
      includeInactive: q.include_inactive });
  }
  @Get(':id') findOne(@Param('id') id: string) { return this.service.findById(id); }
  @Post() create(@Body() dto: CreateServiceTypeDto) { return this.service.create(dto); }
  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateServiceTypeDto) { return this.service.update(id, dto); }
  @Delete(':id') remove(@Param('id') id: string) { return this.service.remove(id); }
}
