import { describe, expect, test } from 'vitest';

import remToPx from './CountRemToPx';

describe('remToPx', () => {
  test('does not rely on an implicit global user agent variable', () => {
    expect(remToPx(10)).toBe(100);
  });
});
