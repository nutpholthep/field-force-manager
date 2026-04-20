import { Module } from '@nestjs/common';
import { WorkOrderMaterialsController } from './work-order-materials.controller';
import { WorkOrderMaterialsService } from './work-order-materials.service';

@Module({
  controllers: [WorkOrderMaterialsController],
  providers: [WorkOrderMaterialsService],
  exports: [WorkOrderMaterialsService],
})
export class WorkOrderMaterialsModule {}
