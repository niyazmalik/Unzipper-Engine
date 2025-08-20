import { Injectable } from '@nestjs/common';
import { ProcessFileDto } from './dto/process-file.dto';
import { validateUrl } from 'src/common/utils/uri-util';
import { DownloadService } from 'src/download/download.service';
import { ExtractService } from 'src/extract/extract.service';
import { getTempFilePath } from 'src/common/utils/file-name.util';
import { isValidZip } from 'src/common/guards/valid-zip.guard';

@Injectable()
export class FileService {
    constructor(
        private readonly downloadService: DownloadService,
        private readonly extractService: ExtractService) { }

    async enqueueProcess(dto: ProcessFileDto) {
        /* Checking whether this url is whitelisted or not */
        validateUrl(dto.url);

        /* Generating file name */
        const tempPath = getTempFilePath('download', 'zip');

        /* Downloading files */
        await this.downloadService.downloadFile(dto.url, tempPath, 3);

        if (!isValidZip(tempPath)) {
            throw new Error('Downloaded file is not a valid ZIP archive.');
        }

        /* Extracting files */
        const extractDir = await this.extractService.extractZip(tempPath);

        return extractDir;
    }
}
