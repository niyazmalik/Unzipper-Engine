import { Injectable } from '@nestjs/common';
import { ProcessFileDto } from './dto/process-file.dto';
import { validateUrl } from 'src/utils/uri-utils';
import * as os from 'os';
import * as path from 'path';
import { DownloadService } from 'src/download/download.service';

@Injectable()
export class FileService {
    constructor(private readonly downloadService: DownloadService) {}

    async enqueueProcess(dto: ProcessFileDto) {
        /* Checking whether this url is whitelisted or not */
        validateUrl(dto.url);

        /* Downloading phase */
        const tempPath = path.join(os.tmpdir(), `download-${Date.now()}.zip`);

        await this.downloadService.downloadFile(dto.url, tempPath, 3);

        // Later: unzip, process, move, etc.
        return tempPath;
    }
}
