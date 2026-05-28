// Seeded PRNG. Mulberry32 — small, fast, period 2^32, fine for fixtures.
// Same seed → same sequence forever. Do not swap implementations without
// regenerating every fixture under data/fixtures/.

export type Rng = {
  next(): number;
  int(maxExclusive: number): number;
  range(minInclusive: number, maxExclusive: number): number;
  float(minInclusive: number, maxExclusive: number): number;
  pick<T>(items: readonly T[]): T;
  shuffle<T>(items: readonly T[]): T[];
  bool(probabilityTrue?: number): boolean;
  fork(label: string): Rng;
};

function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createRng(seed: number | string): Rng {
  const seedInt = typeof seed === 'string' ? hashString(seed) : seed >>> 0;
  const next = mulberry32(seedInt);

  const rng: Rng = {
    next,
    int(maxExclusive) {
      return Math.floor(next() * maxExclusive);
    },
    range(minInclusive, maxExclusive) {
      return minInclusive + Math.floor(next() * (maxExclusive - minInclusive));
    },
    float(minInclusive, maxExclusive) {
      return minInclusive + next() * (maxExclusive - minInclusive);
    },
    pick(items) {
      if (items.length === 0) throw new Error('cannot pick from empty array');
      return items[Math.floor(next() * items.length)] as (typeof items)[number];
    },
    shuffle(items) {
      const copy = items.slice();
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        const ai = copy[i] as (typeof copy)[number];
        const aj = copy[j] as (typeof copy)[number];
        copy[i] = aj;
        copy[j] = ai;
      }
      return copy;
    },
    bool(probabilityTrue = 0.5) {
      return next() < probabilityTrue;
    },
    fork(label) {
      return createRng(hashString(`${seedInt}:${label}`));
    },
  };

  return rng;
}
