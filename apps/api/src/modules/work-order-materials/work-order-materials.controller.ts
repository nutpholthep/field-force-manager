import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { parseWhere } from '../../common/utils/query.util';
import { ListQueryDto } from '../../common/dto/list-query.dto';
import { WorkOrderMaterialsService } from './work-order-materials.service';
import { CreateWorkOrderMaterialDto, UpdateWorkOrderMaterialDto } from './dto/work-order-material.dto';

@ApiTags('work-order-materials')
@ApiBearerAuth()
@Controller('work-order-materials')
export class WorkOrderMaterialsController {
  constructor(private readonly service: WorkOrderMaterialsService) {}
  @Get() list(@Query() q: ListQueryDto) {
    return this.service.list({ sort: q.sort, limit: q.limit, offset: q.offset, where: parseWhere(q.where) });
  }
  @Get(':id') findOne(@Param('id') id: string) { return this.service.findById(id); }
  @Post() create(@Body() dto: CreateWorkOrderMaterialDto) { return this.service.create(dto); }
  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateWorkOrderMaterialDto) { return this.service.update(id, dto); }
  @Delete(':id') remove(@Param('id') id: string) { return this.service.remove(id); }
}
