import { Module } from '@nestjs/common';
import { FileController } from './file.controller';
import { FileService } from './file.service';
import { DownloadService } from 'src/download/download.service';

@Module({
  controllers: [FileController],
  providers: [FileService, DownloadService],
})
export class FileModule {}