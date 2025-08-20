import { Module } from '@nestjs/common';
import { FileController } from './file.controller';
import { FileService } from './file.service';
import { DownloadService } from 'src/download/download.service';
import { ExtractService } from 'src/extract/extract.service';

@Module({
  controllers: [FileController],
  providers: [FileService, DownloadService, ExtractService],
})
export class FileModule {}