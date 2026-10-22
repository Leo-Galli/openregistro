import { describe, expect, it } from 'vitest';
import { weightedAverage } from './grades';

describe('weightedAverage', () => {
  it('returns null for an empty list', () => {
    expect(weightedAverage([])).toBeNull();
  });

  it('returns the plain average when all weights are equal', () => {
    const grades = [
      { value: 6, weight: 1 },
      { value: 8, weight: 1 },
    ];
    expect(weightedAverage(grades)).toBe(7);
  });

  it('weighs heavier assessments more', () => {
    const grades = [
      { value: 4, weight: 1 },
      { value: 10, weight: 2 },
    ];
    expect(weightedAverage(grades)).toBeCloseTo(8, 5);
  });
});
