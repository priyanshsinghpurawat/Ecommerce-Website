import { describe, it, expect } from 'vitest';
import { unwrapData, getErrorMessage } from './apiHelpers.js';

describe('presentation tier: apiHelpers', () => {
  it('unwrapData reads nested API payloads', () => {
    const envelope = {
      success: true,
      data: { user: { email: 'a@b.com' }, token: 'abc' }
    };
    expect(unwrapData(envelope)).toEqual(envelope.data);
  });

  it('unwrapData passes through plain objects', () => {
    expect(unwrapData({ user: 1 })).toEqual({ user: 1 });
  });

  it('getErrorMessage surfaces API messages', () => {
    const err = { response: { data: { message: 'Email or password is wrong.' } } };
    expect(getErrorMessage(err)).toBe('Email or password is wrong.');
  });

  it('getErrorMessage explains network failures', () => {
    const err = { code: 'ERR_NETWORK' };
    expect(getErrorMessage(err)).toMatch(/Can't reach the shop API/i);
  });
});
