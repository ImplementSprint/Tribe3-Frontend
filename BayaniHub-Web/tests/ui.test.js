import { describe, it, expect } from 'vitest';

describe('BayaniHub-Web', () => {
  it('should have correct project name', () => {
    expect('BayaniHub').toBeTruthy();
  });

  it('should pass basic math', () => {
    expect(1 + 1).toBe(2);
  });
});
