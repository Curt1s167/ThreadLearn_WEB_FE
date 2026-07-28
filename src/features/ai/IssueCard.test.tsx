import { render, screen } from '@testing-library/react';
import { IssueCard } from './IssueCard';

const baseIssue = {
  patternId: 'race',
  lineRange: '1',
  severity: 'high' as const,
  description: 'Shared state can race.',
};

describe('IssueCard premium gating', () => {
  it('shows no hidden fix or resolve action when the API redacts a Free response', () => {
    render(<IssueCard issue={baseIssue} index={0} />);

    expect(screen.getByText(/available with Premium/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /resolve/i })).not.toBeInTheDocument();
  });

  it('renders a fix for an entitled response', () => {
    render(<IssueCard issue={{ ...baseIssue, fix: 'Use immutable state.' }} index={0} />);

    expect(screen.getByText('Use immutable state.')).toBeInTheDocument();
    expect(screen.queryByText(/available with Premium/i)).not.toBeInTheDocument();
  });
});
