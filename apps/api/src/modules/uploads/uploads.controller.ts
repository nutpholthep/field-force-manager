import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { memoryStorage } from 'multer';
import { UploadsService } from './uploads.service';

@ApiTags('uploads')
@ApiBearerAuth()
@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploads: UploadsService) {}

  @Post()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 25 * 1024 * 1024 },
    }),
  )
  async upload(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('file is required');
    const { file_url } = await this.uploads.saveUploadedFile(file);
    return { file_url };
  }

  @Get('file/:name')
  async download(@Param('name') name: string, @Res({ passthrough: false }) res: Response) {
    await this.uploads.pipeFileToResponse(name, res);
  }
}
