import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from './ErrorBoundary.jsx';

const ThrowingComponent = () => {
  throw new Error('Test error');
};

const GoodComponent = () => <div>Child content</div>;

describe('ErrorBoundary', () => {
  it('renders children when no error', () => {
    render(
      <ErrorBoundary>
        <GoodComponent />
      </ErrorBoundary>
    );
    expect(screen.getByText('Child content')).toBeInTheDocument();
  });

  it('renders error UI when child throws', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    );
    expect(screen.getByText('Interface Interrupted')).toBeInTheDocument();
    expect(screen.getByText(/unexpected exception/)).toBeInTheDocument();
    expect(screen.getByText((content) => content.includes('Test error'))).toBeInTheDocument();
    consoleSpy.mockRestore();
  });

  it('renders Reset View and Return Hub buttons on error', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    );
    expect(screen.getByText('Reset View')).toBeInTheDocument();
    expect(screen.getByText('Return Hub')).toBeInTheDocument();
    consoleSpy.mockRestore();
  });
});
