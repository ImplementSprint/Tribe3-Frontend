import { describe, it, expect } from 'vitest';

describe('DAMAYAN-Web', () => {
  it('should have correct project name', () => {
    expect('DAMAYAN').toBeTruthy();
  });

  it('should pass basic math', () => {
    expect(1 + 1).toBe(2);
  });
});
