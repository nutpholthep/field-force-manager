import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AiService } from './ai.service';

@ApiTags('ai')
@ApiBearerAuth()
@Controller('ai')
export class AiController {
  constructor(private readonly ai: AiService) {}

  @Post('invoke')
  invoke(@Body() body: Record<string, unknown>) {
    return this.ai.invoke(body);
  }
}
