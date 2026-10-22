import path from 'node:path';
import { JsonFileStore } from './file-store';
import { withFileLock } from './file-lock';

interface WithId {
  id: string;
}

interface CollectionFile<T> {
  items: T[];
}

function matchesFilter<T extends WithId>(item: T, filter: Partial<T>): boolean {
  return (Object.keys(filter) as (keyof T)[]).every((key) => item[key] === filter[key]);
}

/**
 * Generic array-of-records storage for one entity type, backed by a single
 * JSON file under the driver's data directory. All mutating operations are
 * serialized with a file lock so concurrent requests in the same process (or
 * across processes on the same host) cannot interleave reads and writes.
 */
export class JsonCollection<T extends WithId> {
  private readonly store: JsonFileStore<CollectionFile<T>>;
  private readonly lockPath: string;

  constructor(
    dataDir: string,
    readonly name: string,
  ) {
    const filePath = path.join(dataDir, `${name}.json`);
    this.lockPath = `${filePath}.lock`;
    this.store = new JsonFileStore<CollectionFile<T>>(filePath, { items: [] });
  }

  async findById(id: string): Promise<T | null> {
    const { items } = await this.store.read();
    return items.find((item) => item.id === id) ?? null;
  }

  async findMany(filter?: Partial<T>): Promise<T[]> {
    const { items } = await this.store.read();
    if (!filter || Object.keys(filter).length === 0) return items;
    return items.filter((item) => matchesFilter(item, filter));
  }

  async create(item: T): Promise<T> {
    return withFileLock(this.lockPath, async () => {
      const data = await this.store.read();
      data.items.push(item);
      await this.store.write(data);
      return item;
    });
  }

  async replace(id: string, item: T): Promise<T> {
    return withFileLock(this.lockPath, async () => {
      const data = await this.store.read();
      const index = data.items.findIndex((existing) => existing.id === id);
      if (index === -1) {
        throw new Error(`Cannot replace missing item "${id}" in collection "${this.name}"`);
      }
      data.items[index] = item;
      await this.store.write(data);
      return item;
    });
  }

  async delete(id: string): Promise<void> {
    return withFileLock(this.lockPath, async () => {
      const data = await this.store.read();
      data.items = data.items.filter((item) => item.id !== id);
      await this.store.write(data);
    });
  }
}
