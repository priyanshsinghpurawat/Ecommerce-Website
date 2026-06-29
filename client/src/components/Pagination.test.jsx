import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Pagination } from './Pagination.jsx';

describe('Pagination Component', () => {
  it('renders nothing when totalPages <= 1', () => {
    const { container } = render(<Pagination currentPage={1} totalPages={1} onPageChange={vi.fn()} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders page info and buttons', () => {
    render(<Pagination currentPage={2} totalPages={5} onPageChange={vi.fn()} />);
    expect(screen.getByText('Page 2 of 5')).toBeInTheDocument();
  });

  it('calls onPageChange with previous page', () => {
    const onChange = vi.fn();
    render(<Pagination currentPage={3} totalPages={5} onPageChange={onChange} />);
    const prevBtn = screen.getAllByRole('button')[0];
    fireEvent.click(prevBtn);
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it('calls onPageChange with next page', () => {
    const onChange = vi.fn();
    render(<Pagination currentPage={3} totalPages={5} onPageChange={onChange} />);
    const nextBtn = screen.getAllByRole('button')[1];
    fireEvent.click(nextBtn);
    expect(onChange).toHaveBeenCalledWith(4);
  });

  it('disables prev button on first page', () => {
    render(<Pagination currentPage={1} totalPages={5} onPageChange={vi.fn()} />);
    const prevBtn = screen.getAllByRole('button')[0];
    expect(prevBtn).toBeDisabled();
  });

  it('disables next button on last page', () => {
    render(<Pagination currentPage={5} totalPages={5} onPageChange={vi.fn()} />);
    const nextBtn = screen.getAllByRole('button')[1];
    expect(nextBtn).toBeDisabled();
  });

  it('disables buttons when loading', () => {
    render(<Pagination currentPage={3} totalPages={5} onPageChange={vi.fn()} loading={true} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons[0]).toBeDisabled();
    expect(buttons[1]).toBeDisabled();
  });
});
