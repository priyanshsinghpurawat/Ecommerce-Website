import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../services/category.service.js';

vi.mock('../services/category.service.js');

describe('useCategories', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('returns empty categories on initial render', async () => {
    const { useCategories } = await import('./useCategories.js');
    const { renderHook } = await import('@testing-library/react');
    const { result } = renderHook(() => useCategories());
    expect(result.current.categories).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it('fetches categories and updates state', async () => {
    const mockCategories = [
      { _id: '1', name: 'Clothing' },
      { _id: '2', name: 'Footwear' },
    ];
    getCategories.mockResolvedValue({ data: mockCategories });

    const { useCategories } = await import('./useCategories.js');
    const { renderHook, act } = await import('@testing-library/react');
    const { result } = renderHook(() => useCategories());

    await act(async () => {
      await result.current.fetchCategories();
    });

    expect(result.current.categories).toEqual(mockCategories);
  });

  it('caches categories on repeated calls', async () => {
    const mockCategories = [{ _id: '1', name: 'Clothing' }];
    getCategories.mockResolvedValue({ data: mockCategories });

    const { useCategories } = await import('./useCategories.js');
    const { renderHook, act } = await import('@testing-library/react');
    const { result } = renderHook(() => useCategories());

    await act(async () => {
      await result.current.fetchCategories();
    });

    await act(async () => {
      await result.current.fetchCategories();
    });

    expect(getCategories).toHaveBeenCalledTimes(1);
  });

  it('adds a category to the list', async () => {
    getCategories.mockResolvedValue({ data: [] });
    const newCat = { _id: '3', name: 'Accessories' };
    createCategory.mockResolvedValue({ data: newCat });

    const { useCategories } = await import('./useCategories.js');
    const { renderHook, act } = await import('@testing-library/react');
    const { result } = renderHook(() => useCategories());

    await act(async () => {
      await result.current.fetchCategories();
    });

    await act(async () => {
      await result.current.addCategory('Accessories');
    });

    expect(result.current.categories[0]).toEqual(newCat);
  });

  it('sets error on fetch failure', async () => {
    getCategories.mockRejectedValue({ response: { data: { message: 'Server error' } } });

    const { useCategories } = await import('./useCategories.js');
    const { renderHook, act } = await import('@testing-library/react');
    const { result } = renderHook(() => useCategories());

    await act(async () => {
      await result.current.fetchCategories();
    });

    expect(result.current.error).toBe('Server error');
    expect(result.current.categories).toEqual([]);
  });
});
