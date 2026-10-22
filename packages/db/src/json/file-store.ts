import { promises as fs } from 'node:fs';
import path from 'node:path';

/**
 * Reads and writes a single JSON file. Writes are atomic: content is written
 * to a temporary file in the same directory, then moved into place with
 * `rename`, which is atomic on both POSIX filesystems and NTFS. This avoids
 * ever leaving a half-written file in place if the process is killed
 * mid-write.
 */
export class JsonFileStore<T> {
  constructor(
    private readonly filePath: string,
    private readonly defaultValue: T,
  ) {}

  async read(): Promise<T> {
    try {
      const raw = await fs.readFile(this.filePath, 'utf-8');
      return JSON.parse(raw) as T;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return structuredClone(this.defaultValue);
      }
      throw error;
    }
  }

  async write(value: T): Promise<void> {
    const dir = path.dirname(this.filePath);
    await fs.mkdir(dir, { recursive: true });
    const tempPath = path.join(dir, `.${path.basename(this.filePath)}.${process.pid}.tmp`);
    await fs.writeFile(tempPath, JSON.stringify(value, null, 2), 'utf-8');
    await fs.rename(tempPath, this.filePath);
  }
}
