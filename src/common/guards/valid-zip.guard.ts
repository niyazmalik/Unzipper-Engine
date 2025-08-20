import * as fs from 'fs';

export function isValidZip(filePath: string): boolean {
  const fd = fs.openSync(filePath, 'r');
  const buffer = Buffer.alloc(4);
  fs.readSync(fd, buffer, 0, 4, 0);
  fs.closeSync(fd);

  // ZIP files start with "PK" (0x50 0x4B)
  return buffer[0] === 0x50 && buffer[1] === 0x4B;
}
