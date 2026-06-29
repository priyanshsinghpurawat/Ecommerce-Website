import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import StockHeatmap from './StockHeatmap.jsx';

const mockProducts = [
  {
    _id: '1',
    title: 'White Shirt',
    stock: 45,
    category: { name: 'Clothing' },
    createdAt: '2025-01-15T10:00:00Z',
    updatedAt: '2025-06-20T14:00:00Z',
  },
  {
    _id: '2',
    title: 'Black Jeans',
    stock: 12,
    category: { name: 'Clothing' },
    createdAt: '2025-03-10T08:00:00Z',
    updatedAt: '2025-06-22T09:00:00Z',
  },
  {
    _id: '3',
    title: 'Running Shoes',
    stock: 200,
    category: { name: 'Footwear' },
    createdAt: '2025-02-20T12:00:00Z',
    updatedAt: '2025-06-18T16:00:00Z',
  },
  {
    _id: '4',
    title: 'Cap',
    stock: 3,
    category: { name: 'Accessories' },
    createdAt: '2025-05-01T10:00:00Z',
    updatedAt: '2025-06-25T11:00:00Z',
  },
];

describe('StockHeatmap', () => {
  it('renders skeleton when no products', () => {
    const { container } = render(<StockHeatmap products={[]} />);
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders real category names from products', () => {
    render(<StockHeatmap products={mockProducts} />);
    expect(screen.getByText('Clothing')).toBeInTheDocument();
    expect(screen.getByText('Footwear')).toBeInTheDocument();
    expect(screen.getByText('Accessories')).toBeInTheDocument();
  });

  it('displays total product count and stock in header', () => {
    render(<StockHeatmap products={mockProducts} />);
    expect(screen.getByText(/4 products/)).toBeInTheDocument();
    expect(screen.getByText(/260 total units/)).toBeInTheDocument();
  });

  it('renders timeframe toggle buttons', () => {
    render(<StockHeatmap products={mockProducts} />);
    expect(screen.getByRole('button', { name: /weekly/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /quarterly/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /yearly/i })).toBeInTheDocument();
  });

  it('renders legend with stock thresholds', () => {
    render(<StockHeatmap products={mockProducts} />);
    expect(screen.getByText('0-10')).toBeInTheDocument();
    expect(screen.getByText('11-50')).toBeInTheDocument();
    expect(screen.getByText('51-200')).toBeInTheDocument();
    expect(screen.getByText('200+')).toBeInTheDocument();
  });

  it('handles products with string category (no .name)', () => {
    const stringCatProducts = [
      { _id: '1', title: 'Hat', stock: 10, category: 'Headwear', createdAt: '2025-01-01', updatedAt: '2025-06-25' },
    ];
    render(<StockHeatmap products={stringCatProducts} />);
    expect(screen.getByText('Headwear')).toBeInTheDocument();
  });
});
