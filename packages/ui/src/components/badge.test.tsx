import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from './badge';

describe('Badge', () => {
  it('renders its content', () => {
    render(<Badge>Active</Badge>);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('applies the destructive variant classes', () => {
    render(<Badge variant="destructive">Overdue</Badge>);
    expect(screen.getByText('Overdue').className).toContain('bg-destructive');
  });
});
