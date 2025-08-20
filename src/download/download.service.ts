import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as fs from 'fs';
import * as https from 'https';
import * as http from 'http';
import { pipeline } from 'stream';
import { promisify } from 'util';
import { extractZipLinkFromHtml } from 'src/common/utils/html-zip-link.util';
import { resolveProviderLink } from 'src/common/utils/provider-zip-link';
import { createIdleTimeout } from 'src/common/utils/idle-timeout';

const streamPipeline = promisify(pipeline);

@Injectable()
export class DownloadService {
    async downloadFile(url: string, destPath: string, maxRetries = 3): Promise<void> {
        let attempt = 0;

        while (attempt < maxRetries) {
            attempt++;
            try {
                await this.tryDownload(url, destPath);
                return;
            } catch (err) {
                // cleanup partial file
                if (fs.existsSync(destPath)) {
                    fs.unlinkSync(destPath);
                }

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

    private async tryDownload(url: string, destPath: string, redirectCount = 0): Promise<void> {
        if (redirectCount > 5) {
            throw new Error('Too many redirects');
        }

        const providerResolved = resolveProviderLink(url);
        if (providerResolved && providerResolved !== url) {
            return this.tryDownload(providerResolved, destPath, redirectCount + 1);
        }

        const client = url.startsWith('https') ? https : http;

        return new Promise((resolve, reject) => {
            const request = client.get(url, (res) => {
                if (res.headers['content-type']?.includes('text/html')) {
                    let html = '';
                    res.setEncoding('utf-8');
                    res.on('data', (chunk) => { html += chunk; });
                    res.on('end', () => {
                        const zipUrl = extractZipLinkFromHtml(html, url);
                        if (!zipUrl) {
                            return reject(new Error('No ZIP link found in HTML response'));
                        }
                        // Noww trying again with extracted zip link
                        this.tryDownload(zipUrl, destPath, redirectCount + 1)
                            .then(resolve)
                            .catch(reject);
                    });
                    return; //stopping further execution in this request
                }

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

                // Time out if no data received for 30 seconds...
                const { reset, clear } = createIdleTimeout(() => {
                    request.destroy(new Error('Download stalled (no data received for 30s)'));
                });

                reset();

                res.on('data', (chunk) => {
                    downloadedBytes += chunk.length;
                    reset();
                });

                streamPipeline(res, file)
                    .then(() => {
                        clear();
                        if (expectedSize && downloadedBytes !== expectedSize) {
                            return reject(
                                new Error(
                                    `File size mismatch: expected ${expectedSize}, got ${downloadedBytes}`,
                                ),
                            );
                        }
                        resolve();
                    })
                    .catch((err) => {
                        clear();
                        reject(err);
                    })
            });

            request.on('error', reject);
        });
    }
}
