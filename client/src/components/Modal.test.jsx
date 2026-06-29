import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Modal } from './Modal.jsx';

describe('Modal Component', () => {
  afterEach(() => {
    document.body.style.overflow = 'unset';
  });

  it('renders nothing when closed', () => {
    const { container } = render(<Modal isOpen={false} onClose={vi.fn()} title="Test">Content</Modal>);
    expect(container.innerHTML).toBe('');
  });

  it('renders content when open', () => {
    render(<Modal isOpen={true} onClose={vi.fn()} title="Test Modal">Modal Body</Modal>);
    expect(screen.getByText('Modal Body')).toBeInTheDocument();
    expect(screen.getByText('Test Modal')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(<Modal isOpen={true} onClose={onClose} title="T">Content</Modal>);
    fireEvent.click(screen.getByLabelText('Close modal'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when backdrop is clicked', () => {
    const onClose = vi.fn();
    render(<Modal isOpen={true} onClose={onClose} title="T">Content</Modal>);
    const backdrop = document.querySelector('.fixed.inset-0.bg-black\\/70');
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalled();
  });

  it('locks body scroll when open', () => {
    render(<Modal isOpen={true} onClose={vi.fn()} title="T">Content</Modal>);
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('unlocks body scroll when closed', () => {
    const { rerender } = render(<Modal isOpen={true} onClose={vi.fn()} title="T">Content</Modal>);
    rerender(<Modal isOpen={false} onClose={vi.fn()} title="T">Content</Modal>);
    expect(document.body.style.overflow).toBe('unset');
  });
});
