import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ProductCardSkeleton, DashboardTableSkeleton } from './Skeleton.jsx';

describe('ProductCardSkeleton', () => {
  it('renders skeleton with animate-pulse', () => {
    const { container } = render(<ProductCardSkeleton />);
    const pulsers = container.querySelectorAll('.animate-pulse');
    expect(pulsers.length).toBeGreaterThan(0);
  });
});

describe('DashboardTableSkeleton', () => {
  it('renders skeleton with table structure', () => {
    const { container } = render(<DashboardTableSkeleton />);
    expect(container.querySelector('table')).toBeInTheDocument();
    expect(container.querySelector('thead')).toBeInTheDocument();
    const rows = container.querySelectorAll('tbody tr');
    expect(rows.length).toBe(5);
  });
});
