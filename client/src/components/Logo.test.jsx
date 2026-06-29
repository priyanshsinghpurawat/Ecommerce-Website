import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Logo } from './Logo.jsx';

describe('Logo Component', () => {
  it('renders correctly with default props', () => {
    const { container } = render(<Logo />);
    const svg = container.querySelector('svg');
    
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveClass('h-9 w-9');
  });

  it('renders correctly with custom className', () => {
    const { container } = render(<Logo className="custom-class" />);
    const svg = container.querySelector('svg');
    
    expect(svg).toHaveClass('custom-class');
  });
});
