import * as path from 'path';
import * as os from 'os';

export function getTempFilePath(prefix: string, ext: string): string {
  const now = new Date();
  const ist = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));

  const formatted = ist
    .toISOString()
    .replace(/[:.]/g, '-')
    .replace('T', '_')
    .slice(0, 19);

  return path.join(os.tmpdir(), `${prefix}-${formatted}.${ext}`);
}
