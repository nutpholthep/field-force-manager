import { Module } from '@nestjs/common';
import { UploadsModule } from '../uploads/uploads.module';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';

@Module({
  imports: [UploadsModule],
  controllers: [AiController],
  providers: [AiService],
})
export class AiModule {}
