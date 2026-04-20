import { Module } from '@nestjs/common';
import { StuckReasonsController } from './stuck-reasons.controller';
import { StuckReasonsService } from './stuck-reasons.service';

@Module({
  controllers: [StuckReasonsController],
  providers: [StuckReasonsService],
  exports: [StuckReasonsService],
})
export class StuckReasonsModule {}
