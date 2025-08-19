import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiKeyGuard } from '../common/guards/api-key.guard';
import { ProcessFileDto } from './dto/process-file.dto';
import { FileService } from './file.service';

@Controller('file')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @UseGuards(ApiKeyGuard)
  @Post('process')
  async processFile(@Body() processFileDto: ProcessFileDto) {
    return this.fileService.enqueueProcess(processFileDto);
  }
}