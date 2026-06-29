import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PageLoader } from './PageLoader.jsx';

describe('PageLoader', () => {
  it('renders loading text', () => {
    render(<PageLoader />);
    expect(screen.getByText('Loading MensVibe...')).toBeInTheDocument();
  });

  it('renders the spinner animation container', () => {
    const { container } = render(<PageLoader />);
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
    expect(container.querySelector('.animate-ping')).toBeInTheDocument();
  });
});
