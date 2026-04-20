import { Module } from '@nestjs/common';
import { TechnicianAttendanceController } from './technician-attendance.controller';
import { TechnicianAttendanceService } from './technician-attendance.service';

@Module({
  controllers: [TechnicianAttendanceController],
  providers: [TechnicianAttendanceService],
  exports: [TechnicianAttendanceService],
})
export class TechnicianAttendanceModule {}
