import { describe, expect, test } from 'vitest';
import { createRng } from './rng.js';

describe('createRng', () => {
  test('same seed produces identical sequence', () => {
    const a = createRng(42);
    const b = createRng(42);
    const seqA = Array.from({ length: 50 }, () => a.next());
    const seqB = Array.from({ length: 50 }, () => b.next());
    expect(seqA).toEqual(seqB);
  });

  test('different seeds diverge by the first draw', () => {
    const a = createRng(1);
    const b = createRng(2);
    expect(a.next()).not.toBe(b.next());
  });

  test('string seeds hash through the same path as numeric seeds', () => {
    const a = createRng('helm');
    const b = createRng('helm');
    expect(a.next()).toBe(b.next());
  });

  test('int(n) stays inside [0, n)', () => {
    const rng = createRng('bounds');
    for (let i = 0; i < 1000; i++) {
      const v = rng.int(10);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(10);
    }
  });

  test('range(min, max) stays inside [min, max)', () => {
    const rng = createRng('range');
    for (let i = 0; i < 1000; i++) {
      const v = rng.range(5, 12);
      expect(v).toBeGreaterThanOrEqual(5);
      expect(v).toBeLessThan(12);
    }
  });

  test('pick from non-empty array returns one of the elements', () => {
    const rng = createRng('pick');
    const items = ['a', 'b', 'c', 'd'] as const;
    for (let i = 0; i < 200; i++) {
      const v = rng.pick(items);
      expect(items).toContain(v);
    }
  });

  test('pick from empty array throws', () => {
    const rng = createRng('empty');
    expect(() => rng.pick([])).toThrow(/empty/);
  });

  test('shuffle preserves the multiset of elements', () => {
    const rng = createRng('shuffle');
    const original = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const shuffled = rng.shuffle(original);
    expect(shuffled.length).toBe(original.length);
    expect([...shuffled].sort((a, b) => a - b)).toEqual(original);
  });

  test('shuffle does not mutate the input', () => {
    const rng = createRng('immutable');
    const original = [1, 2, 3, 4, 5];
    const snapshot = [...original];
    rng.shuffle(original);
    expect(original).toEqual(snapshot);
  });

  test('fork(label) is deterministic and independent of the parent', () => {
    const parent = createRng(99);
    const a = parent.fork('child:1');
    const b = parent.fork('child:1');
    // Two forks with the same label produce identical streams.
    expect(a.next()).toBe(b.next());
    expect(a.next()).toBe(b.next());

    // Different labels produce different streams.
    const c = parent.fork('child:2');
    expect(a.next()).not.toBe(c.next());

    // The parent's own stream is independent of fork consumption.
    const beforeFork = createRng(99);
    beforeFork.fork('throwaway').next(); // consume on the fork
    expect(beforeFork.next()).toBe(createRng(99).next());
  });

  test('bool(p) frequency tracks the requested probability', () => {
    const rng = createRng('bool');
    let trues = 0;
    const n = 5000;
    for (let i = 0; i < n; i++) {
      if (rng.bool(0.3)) trues++;
    }
    const observed = trues / n;
    // Loose 5pp tolerance — mulberry32 is not crypto-grade, but for a
    // 5000-sample bool() draw the variance is small enough that this
    // catches both "always true" and "always false" bugs.
    expect(observed).toBeGreaterThan(0.25);
    expect(observed).toBeLessThan(0.35);
  });
});
