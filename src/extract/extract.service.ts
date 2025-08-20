import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as yauzl from 'yauzl';
import { pipeline } from 'stream';
import { promisify } from 'util';

const streamPipeline = promisify(pipeline);

@Injectable()
export class ExtractService {
    /* Here I am preventing zip bombs by limiting no. of files */
    private readonly MAX_FILES = 1000;
    /* And here by limiting the total size for now : 200 MB */
    private readonly MAX_TOTAL_SIZE = 200 * 1024 * 1024;

    async extractZip(zipPath: string): Promise<string> {
        const extractDir = fs.mkdtempSync(path.join(os.tmpdir(), 'unzipped-'));

        return new Promise((resolve, reject) => {
            yauzl.open(zipPath, { lazyEntries: true }, (err, zipfile) => {
                if (err) return reject(err);

                let totalSize = 0;
                let fileCount = 0;

                zipfile.readEntry();

                zipfile.on('entry', (entry) => {
                    fileCount++;
                    if (fileCount > this.MAX_FILES) {
                        zipfile.close();
                        return reject(new InternalServerErrorException('Too many files in zip (possible zip bomb)'));
                    }

                    const destPath = path.join(extractDir, entry.fileName);

                    /* Here preventing zip slip by ensuring things stay in extractDir only */
                    if (!destPath.startsWith(extractDir)) {
                        zipfile.close();
                        return reject(new InternalServerErrorException('Zip entry outside target dir (zip slip)'));
                    }

                    if (/\/$/.test(entry.fileName)) {
                        /* Directory */
                        fs.mkdirSync(destPath, { recursive: true });
                        zipfile.readEntry();
                    } else {
                        /* file */
                        zipfile.openReadStream(entry, async (err, readStream) => {
                            if (err) {
                                zipfile.close();
                                return reject(err);
                            }

                            /* Monitoing file size while extracting */
                            let extractedBytes = 0;
                            readStream.on('data', (chunk) => {
                                extractedBytes += chunk.length;
                                totalSize += chunk.length;

                                if (totalSize > this.MAX_TOTAL_SIZE) {
                                    zipfile.close();
                                    return reject(new InternalServerErrorException('Zip exceeds size limit (possible zip bomb)'));
                                }
                            });

                            fs.mkdirSync(path.dirname(destPath), { recursive: true });

                            const writeStream = fs.createWriteStream(destPath);
                            await streamPipeline(readStream, writeStream);

                            zipfile.readEntry();
                        });
                    }
                });

                zipfile.on('end', () => resolve(extractDir));
                zipfile.on('error', reject);
            });
        });
    }
}
