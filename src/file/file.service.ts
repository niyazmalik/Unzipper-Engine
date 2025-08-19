import { Injectable } from '@nestjs/common';
import { ProcessFileDto } from './dto/process-file.dto';

@Injectable()
export class FileService {
  async enqueueProcess(dto: ProcessFileDto) {
    /* Implementaion yet to begin... */
    return {
      message: 'File process request received',
      url: dto.url,
      folderId: dto.folderId,
    };
  }
}
