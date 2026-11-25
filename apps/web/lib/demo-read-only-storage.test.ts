import { describe, expect, it, vi } from 'vitest';
import type { StorageDriver } from '@openregistro/core';
import { createDemoReadOnlyStorage } from './demo-read-only-storage';

describe('createDemoReadOnlyStorage', () => {
  it('returns a fake entity from create without calling the inner create', async () => {
    const create = vi.fn();
    const inner = {
      kind: 'json',
      grades: {
        create,
        findById: vi.fn(),
        findMany: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
    } as unknown as StorageDriver;

    const wrapped = createDemoReadOnlyStorage(inner);
    const result = await wrapped.grades.create({
      studentId: '11111111-1111-1111-1111-111111111111',
      value: 8,
    } as never);

    expect(create).not.toHaveBeenCalled();
    expect(result).toMatchObject({ value: 8 });
    expect(result.id).toEqual(expect.any(String));
  });

  it('no-ops delete and still allows reads through', async () => {
    const remove = vi.fn();
    const findMany = vi.fn().mockResolvedValue([{ id: 'a' }]);
    const inner = {
      kind: 'json',
      grades: {
        create: vi.fn(),
        findById: vi.fn(),
        findMany,
        update: vi.fn(),
        delete: remove,
      },
    } as unknown as StorageDriver;

    const wrapped = createDemoReadOnlyStorage(inner);
    await wrapped.grades.delete('a' as never);
    const rows = await wrapped.grades.findMany();

    expect(remove).not.toHaveBeenCalled();
    expect(rows).toEqual([{ id: 'a' }]);
    expect(findMany).toHaveBeenCalledOnce();
  });
});
