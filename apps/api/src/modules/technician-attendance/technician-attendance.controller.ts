import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { parseWhere } from '../../common/utils/query.util';
import { ListQueryDto } from '../../common/dto/list-query.dto';
import { TechnicianAttendanceService } from './technician-attendance.service';
import { CreateTechnicianAttendanceDto, UpdateTechnicianAttendanceDto } from './dto/technician-attendance.dto';

@ApiTags('technician-attendance')
@ApiBearerAuth()
@Controller('technician-attendance')
export class TechnicianAttendanceController {
  constructor(private readonly service: TechnicianAttendanceService) {}
  @Get() list(@Query() q: ListQueryDto) {
    return this.service.list({ sort: q.sort, limit: q.limit, offset: q.offset, where: parseWhere(q.where),
      includeInactive: q.include_inactive });
  }
  @Get(':id') findOne(@Param('id') id: string) { return this.service.findById(id); }
  @Post() create(@Body() dto: CreateTechnicianAttendanceDto) { return this.service.create(dto); }
  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateTechnicianAttendanceDto) { return this.service.update(id, dto); }
  @Delete(':id') remove(@Param('id') id: string) { return this.service.remove(id); }
}
