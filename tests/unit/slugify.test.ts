import { slugify, slugWithSuffix } from '@/lib/utils/slugify';

describe('slugify', () => {
  it('converts restaurant name to slug', () => {
    expect(slugify('Sharma Ji ka Dhaba')).toBe('sharma-ji-ka-dhaba');
  });

  it('handles special characters', () => {
    expect(slugify('Café & Grill!!!')).toBe('caf-grill');
  });
});

describe('slugWithSuffix', () => {
  it('returns base for suffix 1', () => {
    expect(slugWithSuffix('sharma-dhaba', 1)).toBe('sharma-dhaba');
  });

  it('appends suffix for collisions', () => {
    expect(slugWithSuffix('sharma-dhaba', 2)).toBe('sharma-dhaba-2');
  });
});
