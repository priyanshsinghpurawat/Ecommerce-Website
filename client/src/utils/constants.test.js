import { describe, it, expect } from 'vitest';
import { COLOR_MAP, COLOR_OPTIONS, SIZE_GROUPS, getSizeGroups, ALL_SIZES } from './constants.js';

describe('COLOR_MAP', () => {
  it('contains hex values for all colors', () => {
    Object.values(COLOR_MAP).forEach(hex => {
      expect(hex).toMatch(/^#[0-9a-fA-F]{6}$/);
    });
  });

  it('has expected colors', () => {
    expect(COLOR_MAP.Black).toBe('#111111');
    expect(COLOR_MAP.White).toBe('#f5f5f5');
    expect(COLOR_MAP.Navy).toBe('#1e3a5f');
  });
});

describe('COLOR_OPTIONS', () => {
  it('matches COLOR_MAP keys', () => {
    expect(COLOR_OPTIONS).toEqual(Object.keys(COLOR_MAP));
  });

  it('is a non-empty array', () => {
    expect(Array.isArray(COLOR_OPTIONS)).toBe(true);
    expect(COLOR_OPTIONS.length).toBeGreaterThan(0);
  });
});

describe('SIZE_GROUPS', () => {
  it('has three groups', () => {
    expect(SIZE_GROUPS).toHaveLength(3);
  });

  it.each(SIZE_GROUPS)('group has sizes and types', (group) => {
    expect(group.label).toBeDefined();
    expect(Array.isArray(group.sizes)).toBe(true);
    expect(group.sizes.length).toBeGreaterThan(0);
    expect(Array.isArray(group.types)).toBe(true);
  });
});

describe('getSizeGroups', () => {
  it('returns all groups when no category', () => {
    expect(getSizeGroups()).toEqual(SIZE_GROUPS);
    expect(getSizeGroups('')).toEqual(SIZE_GROUPS);
  });

  it('filters to apparel for "clothing"', () => {
    const result = getSizeGroups('clothing');
    expect(result.some(g => g.label === 'Apparel')).toBe(true);
  });

  it('filters to footwear for "shoes"', () => {
    const result = getSizeGroups('shoes');
    expect(result.some(g => g.label.includes('Footwear'))).toBe(true);
  });

  it('returns all groups for unknown category', () => {
    const result = getSizeGroups('unknown-category');
    expect(result).toEqual(SIZE_GROUPS);
  });

  it('is case-insensitive', () => {
    const lower = getSizeGroups('footwear');
    const upper = getSizeGroups('FOOTWEAR');
    expect(lower.length).toBe(upper.length);
  });
});

describe('ALL_SIZES', () => {
  it('is a flat array of strings', () => {
    expect(Array.isArray(ALL_SIZES)).toBe(true);
    ALL_SIZES.forEach(s => expect(typeof s).toBe('string'));
  });

  it('contains sizes from all groups', () => {
    SIZE_GROUPS.forEach(group => {
      group.sizes.forEach(size => {
        expect(ALL_SIZES).toContain(size);
      });
    });
  });
});
