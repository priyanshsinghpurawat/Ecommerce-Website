import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  validateImage,
  filterValidImages,
  makeImageItem,
  makeRemoteItem,
  revokeItem,
  getCache,
  setCache,
  clearCache,
  clearAllCache,
  formatCurrency
} from './helpers.js';

describe('validateImage', () => {
  it('returns error for null file', () => {
    expect(validateImage(null)).toBe('No file');
  });

  it('returns error for unsupported type', () => {
    expect(validateImage({ type: 'image/gif', size: 1000 })).toBe('Unsupported type: image/gif');
  });

  it('returns error for oversized file', () => {
    const file = { type: 'image/jpeg', size: 6 * 1024 * 1024 };
    expect(validateImage(file)).toBe('Too large (max 5MB)');
  });

  it('returns null for valid file', () => {
    const file = { type: 'image/jpeg', size: 1000 };
    expect(validateImage(file)).toBeNull();
  });

  it('accepts png, webp, avif', () => {
    expect(validateImage({ type: 'image/png', size: 100 })).toBeNull();
    expect(validateImage({ type: 'image/webp', size: 100 })).toBeNull();
    expect(validateImage({ type: 'image/avif', size: 100 })).toBeNull();
  });
});

describe('filterValidImages', () => {
  it('filters out invalid files', () => {
    const files = [
      { type: 'image/jpeg', size: 100 },
      { type: 'image/gif', size: 100 },
      { type: 'image/png', size: 100 }
    ];
    const result = filterValidImages(files);
    expect(result.length).toBe(2);
  });

  it('returns empty for null input', () => {
    expect(filterValidImages(null)).toEqual([]);
  });
});

describe('makeImageItem', () => {
  beforeEach(() => {
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:mock-url'),
      revokeObjectURL: vi.fn(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('creates file item with previewUrl', () => {
    const file = new File(['dummy'], 'test.jpg', { type: 'image/jpeg' });
    const item = makeImageItem(file);
    expect(item.kind).toBe('file');
    expect(item.file).toBe(file);
    expect(item.previewUrl).toBeDefined();
    expect(item.id).toContain('test.jpg');
    URL.revokeObjectURL(item.previewUrl);
  });
});

describe('makeRemoteItem', () => {
  it('creates remote item', () => {
    const item = makeRemoteItem('https://example.com/img.jpg');
    expect(item.kind).toBe('remote');
    expect(item.url).toBe('https://example.com/img.jpg');
    expect(item.id).toContain('remote-');
  });
});

describe('revokeItem', () => {
  it('revokes blob URLs for file items', () => {
    const revokeSpy = vi.spyOn(URL, 'revokeObjectURL');
    const item = { kind: 'file', previewUrl: 'blob:http://localhost/test' };
    revokeItem(item);
    expect(revokeSpy).toHaveBeenCalledWith('blob:http://localhost/test');
    revokeSpy.mockRestore();
  });

  it('does not revoke non-blob URLs', () => {
    const revokeSpy = vi.spyOn(URL, 'revokeObjectURL');
    const item = { kind: 'remote', previewUrl: 'https://example.com/img.jpg' };
    revokeItem(item);
    expect(revokeSpy).not.toHaveBeenCalled();
    revokeSpy.mockRestore();
  });

  it('handles null item', () => {
    expect(() => revokeItem(null)).not.toThrow();
  });
});

describe('client cache functions', () => {
  beforeEach(() => { clearAllCache(); });

  it('setCache/getCache stores and retrieves data', () => {
    setCache('test-key', { foo: 'bar' });
    expect(getCache('test-key')).toEqual({ foo: 'bar' });
  });

  it('getCache returns null for missing key', () => {
    expect(getCache('nonexistent')).toBeNull();
  });

  it('getCache returns null for expired entries', () => {
    setCache('expired', 'data', -1);
    expect(getCache('expired')).toBeNull();
  });

  it('clearCache removes specific key', () => {
    setCache('to-clear', 'value');
    clearCache('to-clear');
    expect(getCache('to-clear')).toBeNull();
  });

  it('clearAllCache removes everything', () => {
    setCache('a', 1);
    setCache('b', 2);
    clearAllCache();
    expect(getCache('a')).toBeNull();
    expect(getCache('b')).toBeNull();
  });
});

describe('formatCurrency', () => {
  it('formats number as INR', () => {
    expect(formatCurrency(1000)).toBe('₹1,000');
  });

  it('formats zero', () => {
    expect(formatCurrency(0)).toBe('₹0');
  });

  it('handles null/undefined', () => {
    expect(formatCurrency(null)).toBe('₹0');
    expect(formatCurrency(undefined)).toBe('₹0');
  });

  it('formats large numbers', () => {
    expect(formatCurrency(100000)).toBe('₹1,00,000');
  });
});
