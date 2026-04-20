import { Module } from '@nestjs/common';
import { WorkOrderStepDataController } from './work-order-step-data.controller';
import { WorkOrderStepDataService } from './work-order-step-data.service';

@Module({
  controllers: [WorkOrderStepDataController],
  providers: [WorkOrderStepDataService],
  exports: [WorkOrderStepDataService],
})
export class WorkOrderStepDataModule {}
