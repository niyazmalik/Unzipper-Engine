import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as fs from 'fs';
import * as https from 'https';
import * as http from 'http';
import { pipeline } from 'stream';
import { promisify } from 'util';

const streamPipeline = promisify(pipeline);

@Injectable()
export class DownloadService {
    async downloadFile(url: string, destPath: string, maxRetries = 3): Promise<void> {
        let attempt = 0;

        while (attempt < maxRetries) {
            attempt++;
            try {
                await this.tryDownload(url, destPath, maxRetries);
                return;
            } catch (err) {
                if (attempt === maxRetries) {
                    throw new InternalServerErrorException(
                        `Download failed after ${maxRetries} attempts: ${err.message}`,
                    );
                }
                const delay = attempt * 2000; // backoff: 2s, 4s, 6s
                await new Promise((resolve) => setTimeout(resolve, delay));
            }
        }
    }

    private async tryDownload(url: string, destPath: string, maxRetries: number, redirectCount = 0): Promise<void> {
        if (redirectCount > maxRetries) {
            throw new Error('Too many redirects');
        }

        const client = url.startsWith('https') ? https : http;

        return new Promise((resolve, reject) => {
            const request = client.get(url, (res) => {

                if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                    const newUrl = res.headers.location.startsWith('http')
                        ? res.headers.location
                        : new URL(res.headers.location, url).toString(); // handling relative redirects
                    return this.tryDownload(newUrl, destPath, redirectCount + 1)
                        .then(resolve)
                        .catch(reject);
                }

                if (res.statusCode !== 200) {
                    return reject(new Error(`Request failed with status ${res.statusCode}`));
                }

                const expectedSize = res.headers['content-length']
                    ? parseInt(res.headers['content-length'], 10)
                    : undefined;

                const file = fs.createWriteStream(destPath);
                let downloadedBytes = 0;

                res.on('data', (chunk) => {
                    downloadedBytes += chunk.length;
                });

                streamPipeline(res, file)
                    .then(() => {
                        if (expectedSize && downloadedBytes !== expectedSize) {
                            return reject(
                                new Error(
                                    `File size mismatch: expected ${expectedSize}, got ${downloadedBytes}`,
                                ),
                            );
                        }
                        resolve();
                    })
                    .catch(reject);
            });

            request.on('error', reject);
            request.setTimeout(30000, () => {
                request.destroy(new Error('Request timed out'));
            });
        });
    }
}
